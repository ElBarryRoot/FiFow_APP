import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import type { Prisma, UserStatus } from '@prisma/client';
import { env } from '../../config/env.js';
import { prisma } from '../../config/prisma.js';
import { getEmailSender } from '../../shared/email/email.service.js';
import { ApiError } from '../../shared/errors/api-error.js';
import { hashToken, randomToken, safeTokenEquals } from '../../shared/security/crypto.js';
import { currentUserSelect, toCurrentUserDto } from '../users/user.dto.js';
import type {
  ChangePasswordInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput
} from './auth.schemas.js';
import {
  createRefreshSecret,
  formatRefreshToken,
  parseRefreshToken,
  refreshExpiryDate,
  signAccessToken
} from './token.service.js';

const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_LOCK_MINUTES = 15;
const DUMMY_PASSWORD_HASH = '$2b$12$03PcQfNt8zSPN6XBGNhnS.5TrBMCW21PuQJX6K4iR7HiVHoHp1q9W';

type ClientContext = {
  ipAddress?: string | undefined;
  userAgent?: string | undefined;
  deviceName?: string | undefined;
};

type PasswordChangeContext = ClientContext & {
  sessionId: string;
  requestId: string;
};

type PasswordChangeSession = {
  id: string;
  refreshTokenHash: string;
  expiresAt: Date;
  user: {
    id: string;
    role: SessionUser['role'];
    status: UserStatus;
    passwordHash: string | null;
  };
};

export type PasswordChangeDependencies = {
  findActiveSession(userId: string, sessionId: string): Promise<PasswordChangeSession | null>;
  comparePassword(value: string, passwordHash: string): Promise<boolean>;
  hashPassword(value: string): Promise<string>;
  runInTransaction(
    callback: (transaction: TransactionClient) => Promise<number>
  ): Promise<number>;
};

type SessionUser = {
  id: string;
  role: 'USER' | 'MODERATOR' | 'ADMIN' | 'SUPER_ADMIN';
};

type TransactionClient = Prisma.TransactionClient;

function normalizePhone(phone?: string) {
  if (!phone) return null;
  return phone.replace(/\s+/g, '');
}

function assertAccountAllowed(status: UserStatus) {
  if (status === 'SUSPENDED') {
    throw new ApiError(403, 'Compte temporairement suspendu.', 'ACCOUNT_SUSPENDED');
  }
  if (status === 'BANNED' || status === 'ARCHIVED') {
    throw new ApiError(403, 'Compte non autorisé.', 'ACCOUNT_NOT_ALLOWED');
  }
}

function tokenExpiry(minutes: number) {
  return new Date(Date.now() + minutes * 60_000);
}

function verificationUrl(token: string) {
  return `${env.WEB_APP_URL}/verify-email?token=${encodeURIComponent(token)}`;
}

function passwordResetUrl(token: string) {
  return `${env.WEB_APP_URL}/reset-password?token=${encodeURIComponent(token)}`;
}

async function currentTermsVersion(tx: TransactionClient) {
  const setting = await tx.appSetting.findUnique({
    where: { key: 'terms_version' },
    select: { value: true }
  });
  return typeof setting?.value === 'string' ? setting.value : '1.0';
}

async function issueSession(tx: TransactionClient, user: SessionUser, context: ClientContext) {
  const sessionId = randomUUID();
  const secret = createRefreshSecret();
  const refreshToken = formatRefreshToken(sessionId, secret);
  const expiresAt = refreshExpiryDate();

  await tx.session.create({
    data: {
      id: sessionId,
      userId: user.id,
      refreshTokenHash: hashToken(secret),
      tokenFamily: randomUUID(),
      ...(context.deviceName ? { deviceName: context.deviceName.slice(0, 120) } : {}),
      ...(context.ipAddress ? { ipAddress: context.ipAddress.slice(0, 64) } : {}),
      ...(context.userAgent ? { userAgent: context.userAgent.slice(0, 2_000) } : {}),
      expiresAt
    }
  });

  return {
    accessToken: signAccessToken({ sub: user.id, sessionId, role: user.role }),
    refreshToken,
    refreshExpiresAt: expiresAt
  };
}

async function sendVerificationEmail(email: string, fullName: string, token: string) {
  await getEmailSender().send({
    to: email,
    subject: 'Vérifiez votre adresse email Fi Fow',
    text: `Bonjour ${fullName},\n\nVérifiez votre adresse email avec ce lien:\n${verificationUrl(token)}\n\nCe lien expire bientôt.`
  });
}

const passwordChangeDependencies: PasswordChangeDependencies = {
  findActiveSession(userId, sessionId) {
    return prisma.session.findFirst({
      where: {
        id: sessionId,
        userId,
        revokedAt: null,
        expiresAt: { gt: new Date() }
      },
      select: {
        id: true,
        refreshTokenHash: true,
        expiresAt: true,
        user: {
          select: {
            id: true,
            role: true,
            status: true,
            passwordHash: true
          }
        }
      }
    });
  },
  comparePassword(value, passwordHash) {
    return bcrypt.compare(value, passwordHash);
  },
  hashPassword(value) {
    return bcrypt.hash(value, env.BCRYPT_SALT_ROUNDS);
  },
  runInTransaction(callback) {
    return prisma.$transaction(callback);
  }
};

export const authService = {
  async register(input: RegisterInput, context: ClientContext) {
    if (!env.EMAIL_AUTH_ENABLED) {
      throw new ApiError(503, 'Inscription par email indisponible.', 'EMAIL_AUTH_DISABLED');
    }

    const phone = normalizePhone(input.phone);
    const verificationToken = randomToken(32);
    const passwordHash = await bcrypt.hash(input.password, env.BCRYPT_SALT_ROUNDS);

    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.user.findFirst({
        where: {
          OR: [{ email: input.email }, ...(phone ? [{ phone }] : [])]
        },
        select: { email: true, phone: true }
      });

      if (existing?.email === input.email) {
        throw new ApiError(409, 'Cette adresse email est déjà utilisée.', 'EMAIL_ALREADY_USED');
      }
      if (phone && existing?.phone === phone) {
        throw new ApiError(409, 'Ce numéro de téléphone est déjà utilisé.', 'PHONE_ALREADY_USED');
      }

      const now = new Date();
      const termsVersion = await currentTermsVersion(tx);
      const user = await tx.user.create({
        data: {
          email: input.email,
          passwordHash,
          fullName: input.fullName,
          phone,
          commune: input.commune ?? null,
          quartier: input.quartier ?? null,
          termsAcceptedAt: now,
          termsVersion,
          emailVerifiedAt: env.EMAIL_VERIFICATION_REQUIRED ? null : now
        },
        select: currentUserSelect
      });

      if (env.EMAIL_VERIFICATION_REQUIRED) {
        await tx.emailVerificationToken.create({
          data: {
            userId: user.id,
            tokenHash: hashToken(verificationToken),
            expiresAt: tokenExpiry(env.EMAIL_TOKEN_EXPIRES_MINUTES)
          }
        });
      }

      const session = await issueSession(tx, user, context);
      return { user, session };
    });

    if (env.EMAIL_VERIFICATION_REQUIRED) {
      await sendVerificationEmail(result.user.email, result.user.fullName, verificationToken);
    }

    return {
      user: toCurrentUserDto(result.user),
      ...result.session,
      emailVerificationRequired: env.EMAIL_VERIFICATION_REQUIRED
    };
  },

  async login(input: LoginInput, context: ClientContext) {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
      select: {
        ...currentUserSelect,
        passwordHash: true,
        failedLoginAttempts: true,
        lockedUntil: true
      }
    });

    if (!user) {
      await bcrypt.compare(input.password, DUMMY_PASSWORD_HASH);
      throw new ApiError(401, 'Email ou mot de passe incorrect.', 'INVALID_CREDENTIALS');
    }

    assertAccountAllowed(user.status);
    const now = new Date();
    if (user.lockedUntil && user.lockedUntil > now) {
      throw new ApiError(429, 'Compte temporairement verrouillé. Réessayez plus tard.', 'ACCOUNT_LOCKED');
    }

    const passwordMatches = user.passwordHash
      ? await bcrypt.compare(input.password, user.passwordHash)
      : false;

    if (!passwordMatches) {
      const nextAttempts = user.failedLoginAttempts + 1;
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: nextAttempts >= MAX_LOGIN_ATTEMPTS ? 0 : nextAttempts,
          lockedUntil:
            nextAttempts >= MAX_LOGIN_ATTEMPTS
              ? new Date(now.getTime() + LOGIN_LOCK_MINUTES * 60_000)
              : null
        }
      });
      throw new ApiError(401, 'Email ou mot de passe incorrect.', 'INVALID_CREDENTIALS');
    }

    const session = await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: 0,
          lockedUntil: null,
          lastLoginAt: now,
          lastActiveAt: now
        }
      });
      return issueSession(tx, user, context);
    });

    return {
      user: toCurrentUserDto(user),
      ...session,
      emailVerificationRequired: env.EMAIL_VERIFICATION_REQUIRED && !user.emailVerifiedAt
    };
  },

  async refresh(rawRefreshToken: string, context: ClientContext) {
    const { sessionId, secret } = parseRefreshToken(rawRefreshToken);
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        user: {
          select: {
            id: true,
            role: true,
            status: true,
            emailVerifiedAt: true
          }
        }
      }
    });

    if (!session || session.revokedAt || session.expiresAt <= new Date()) {
      throw new ApiError(401, 'Session invalide ou expirée.', 'INVALID_REFRESH_TOKEN');
    }
    assertAccountAllowed(session.user.status);

    if (!safeTokenEquals(secret, session.refreshTokenHash)) {
      await prisma.session.updateMany({
        where: { tokenFamily: session.tokenFamily, revokedAt: null },
        data: { revokedAt: new Date(), revokeReason: 'REFRESH_TOKEN_REUSE' }
      });
      throw new ApiError(401, 'Session compromise détectée. Reconnectez-vous.', 'REFRESH_TOKEN_REUSED');
    }

    const nextSecret = createRefreshSecret();
    const updated = await prisma.session.updateMany({
      where: {
        id: session.id,
        refreshTokenHash: session.refreshTokenHash,
        revokedAt: null,
        expiresAt: { gt: new Date() }
      },
      data: {
        refreshTokenHash: hashToken(nextSecret),
        lastUsedAt: new Date(),
        ...(context.ipAddress ? { ipAddress: context.ipAddress.slice(0, 64) } : {}),
        ...(context.userAgent ? { userAgent: context.userAgent.slice(0, 2_000) } : {})
      }
    });

    if (updated.count !== 1) {
      await prisma.session.updateMany({
        where: { tokenFamily: session.tokenFamily, revokedAt: null },
        data: { revokedAt: new Date(), revokeReason: 'CONCURRENT_REFRESH' }
      });
      throw new ApiError(401, 'Session expirée. Reconnectez-vous.', 'REFRESH_CONFLICT');
    }

    return {
      accessToken: signAccessToken({
        sub: session.user.id,
        sessionId: session.id,
        role: session.user.role
      }),
      refreshToken: formatRefreshToken(session.id, nextSecret),
      refreshExpiresAt: session.expiresAt,
      emailVerificationRequired:
        env.EMAIL_VERIFICATION_REQUIRED && !session.user.emailVerifiedAt
    };
  },

  async logout(rawRefreshToken?: string) {
    if (!rawRefreshToken) return;

    let parsed: ReturnType<typeof parseRefreshToken>;
    try {
      parsed = parseRefreshToken(rawRefreshToken);
    } catch {
      return;
    }

    const session = await prisma.session.findUnique({
      where: { id: parsed.sessionId },
      select: { id: true, refreshTokenHash: true }
    });
    if (!session || !safeTokenEquals(parsed.secret, session.refreshTokenHash)) return;

    await prisma.session.updateMany({
      where: { id: session.id, revokedAt: null },
      data: { revokedAt: new Date(), revokeReason: 'USER_LOGOUT' }
    });
  },

  async logoutAll(userId: string) {
    await prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date(), revokeReason: 'USER_LOGOUT_ALL' }
    });
  },

  async verifyEmail(rawToken: string) {
    const tokenHash = hashToken(rawToken);
    const token = await prisma.emailVerificationToken.findUnique({
      where: { tokenHash },
      select: { id: true, userId: true, usedAt: true, expiresAt: true }
    });

    if (!token || token.usedAt || token.expiresAt <= new Date()) {
      throw new ApiError(400, 'Lien de vérification invalide ou expiré.', 'INVALID_EMAIL_TOKEN');
    }

    const consumed = await prisma.$transaction(async (tx) => {
      const update = await tx.emailVerificationToken.updateMany({
        where: { id: token.id, usedAt: null, expiresAt: { gt: new Date() } },
        data: { usedAt: new Date() }
      });
      if (update.count !== 1) return false;

      await tx.user.update({
        where: { id: token.userId },
        data: { emailVerifiedAt: new Date() }
      });
      await tx.emailVerificationToken.updateMany({
        where: { userId: token.userId, id: { not: token.id }, usedAt: null },
        data: { usedAt: new Date() }
      });
      return true;
    });

    if (!consumed) {
      throw new ApiError(400, 'Lien de vérification invalide ou expiré.', 'INVALID_EMAIL_TOKEN');
    }
  },

  async resendVerification(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, fullName: true, emailVerifiedAt: true, status: true }
    });
    if (!user) throw new ApiError(404, 'Utilisateur introuvable.', 'USER_NOT_FOUND');
    assertAccountAllowed(user.status);
    if (user.emailVerifiedAt) return;

    const rawToken = randomToken(32);
    await prisma.$transaction(async (tx) => {
      await tx.emailVerificationToken.updateMany({
        where: { userId, usedAt: null },
        data: { usedAt: new Date() }
      });
      await tx.emailVerificationToken.create({
        data: {
          userId,
          tokenHash: hashToken(rawToken),
          expiresAt: tokenExpiry(env.EMAIL_TOKEN_EXPIRES_MINUTES)
        }
      });
    });
    await sendVerificationEmail(user.email, user.fullName, rawToken);
  },

  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, fullName: true, status: true }
    });

    if (!user || user.status !== 'ACTIVE') {
      await bcrypt.compare(randomToken(16), DUMMY_PASSWORD_HASH);
      return;
    }

    const rawToken = randomToken(32);
    await prisma.$transaction(async (tx) => {
      await tx.passwordResetToken.updateMany({
        where: { userId: user.id, usedAt: null },
        data: { usedAt: new Date() }
      });
      await tx.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash: hashToken(rawToken),
          expiresAt: tokenExpiry(env.PASSWORD_RESET_EXPIRES_MINUTES)
        }
      });
    });

    await getEmailSender().send({
      to: user.email,
      subject: 'Réinitialisez votre mot de passe Fi Fow',
      text: `Bonjour ${user.fullName},\n\nChoisissez un nouveau mot de passe avec ce lien:\n${passwordResetUrl(rawToken)}\n\nCe lien expire bientôt.`
    });
  },

  async resetPassword(input: ResetPasswordInput) {
    const tokenHash = hashToken(input.token);
    const token = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      select: { id: true, userId: true, usedAt: true, expiresAt: true }
    });
    if (!token || token.usedAt || token.expiresAt <= new Date()) {
      throw new ApiError(400, 'Lien de réinitialisation invalide ou expiré.', 'INVALID_RESET_TOKEN');
    }

    const passwordHash = await bcrypt.hash(input.password, env.BCRYPT_SALT_ROUNDS);
    const changedAt = new Date();
    const changed = await prisma.$transaction(async (tx) => {
      const consumed = await tx.passwordResetToken.updateMany({
        where: { id: token.id, usedAt: null, expiresAt: { gt: changedAt } },
        data: { usedAt: changedAt }
      });
      if (consumed.count !== 1) return false;

      await tx.user.update({
        where: { id: token.userId },
        data: {
          passwordHash,
          passwordChangedAt: changedAt,
          failedLoginAttempts: 0,
          lockedUntil: null
        }
      });
      await tx.passwordResetToken.updateMany({
        where: { userId: token.userId, id: { not: token.id }, usedAt: null },
        data: { usedAt: changedAt }
      });
      await tx.session.updateMany({
        where: { userId: token.userId, revokedAt: null },
        data: { revokedAt: changedAt, revokeReason: 'PASSWORD_CHANGED' }
      });
      return true;
    });

    if (!changed) {
      throw new ApiError(400, 'Lien de réinitialisation invalide ou expiré.', 'INVALID_RESET_TOKEN');
    }
  },

  async changePassword(
    userId: string,
    input: ChangePasswordInput,
    context: PasswordChangeContext,
    dependencies: PasswordChangeDependencies = passwordChangeDependencies
  ) {
    const session = await dependencies.findActiveSession(userId, context.sessionId);

    if (!session) {
      throw new ApiError(401, 'Session révoquée ou expirée.', 'SESSION_NOT_AVAILABLE');
    }
    assertAccountAllowed(session.user.status);
    if (!session.user.passwordHash) {
      throw new ApiError(
        409,
        'Ce compte ne possède pas de mot de passe local.',
        'PASSWORD_AUTH_NOT_CONFIGURED'
      );
    }

    const currentPasswordMatches = await dependencies.comparePassword(
      input.currentPassword,
      session.user.passwordHash
    );
    if (!currentPasswordMatches) {
      throw new ApiError(400, 'Le mot de passe actuel est incorrect.', 'CURRENT_PASSWORD_INVALID');
    }

    const changedAt = new Date();
    const nextRefreshSecret = createRefreshSecret();
    const nextRefreshTokenHash = hashToken(nextRefreshSecret);
    const passwordHash = await dependencies.hashPassword(input.password);

    const revokedSessionCount = await dependencies.runInTransaction(async (tx) => {
      const changed = await tx.user.updateMany({
        where: {
          id: userId,
          passwordHash: session.user.passwordHash
        },
        data: {
          passwordHash,
          passwordChangedAt: changedAt,
          failedLoginAttempts: 0,
          lockedUntil: null
        }
      });
      if (changed.count !== 1) {
        throw new ApiError(
          409,
          'Le mot de passe a déjà été modifié. Réessayez.',
          'PASSWORD_CHANGE_CONFLICT'
        );
      }

      const rotatedCurrentSession = await tx.session.updateMany({
        where: {
          id: session.id,
          userId,
          refreshTokenHash: session.refreshTokenHash,
          revokedAt: null,
          expiresAt: { gt: changedAt }
        },
        data: {
          refreshTokenHash: nextRefreshTokenHash,
          lastUsedAt: changedAt,
          ...(context.ipAddress ? { ipAddress: context.ipAddress.slice(0, 64) } : {}),
          ...(context.userAgent ? { userAgent: context.userAgent.slice(0, 2_000) } : {})
        }
      });
      if (rotatedCurrentSession.count !== 1) {
        throw new ApiError(
          409,
          'La session a été renouvelée ailleurs. Réessayez.',
          'PASSWORD_CHANGE_SESSION_CONFLICT'
        );
      }

      await tx.passwordResetToken.updateMany({
        where: { userId, usedAt: null },
        data: { usedAt: changedAt }
      });

      const revokedSessions = await tx.session.updateMany({
        where: {
          userId,
          id: { not: session.id },
          revokedAt: null
        },
        data: {
          revokedAt: changedAt,
          revokeReason: 'PASSWORD_CHANGED'
        }
      });

      await tx.adminLog.create({
        data: {
          actorId: userId,
          action: 'PASSWORD_CHANGED',
          targetType: 'USER',
          targetId: userId,
          after: {
            currentSessionPreserved: true,
            revokedSessionCount: revokedSessions.count
          },
          ...(context.ipAddress ? { ipAddress: context.ipAddress.slice(0, 64) } : {}),
          ...(context.userAgent ? { userAgent: context.userAgent.slice(0, 2_000) } : {}),
          requestId: context.requestId
        }
      });

      return revokedSessions.count;
    });

    return {
      accessToken: signAccessToken({
        sub: userId,
        sessionId: session.id,
        role: session.user.role
      }),
      refreshToken: formatRefreshToken(session.id, nextRefreshSecret),
      refreshExpiresAt: session.expiresAt,
      currentSessionPreserved: true as const,
      revokedSessionCount
    };
  },

  async me(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: currentUserSelect
    });
    if (!user) throw new ApiError(404, 'Utilisateur introuvable.', 'USER_NOT_FOUND');
    assertAccountAllowed(user.status);
    return toCurrentUserDto(user);
  }
};
