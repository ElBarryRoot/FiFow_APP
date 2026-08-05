import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Prisma } from '@prisma/client';
import { ApiError } from '../../shared/errors/api-error.js';
import { authService, type PasswordChangeDependencies } from './auth.service.js';

const SESSION_ID = '11111111-1111-4111-8111-111111111111';
const USER_ID = '22222222-2222-4222-8222-222222222222';
const CURRENT_PASSWORD_HASH = 'stored-current-password-hash';

const passwordChangeInput = {
  currentPassword: 'FiFowSecure2025',
  password: 'FiFowSecure2026',
  passwordConfirmation: 'FiFowSecure2026'
};

const passwordChangeContext = {
  sessionId: SESSION_ID,
  requestId: 'request-password-change',
  ipAddress: '127.0.0.1',
  userAgent: 'FiFow test client'
};

function activeSession() {
  return {
    id: SESSION_ID,
    refreshTokenHash: 'current-refresh-token-hash',
    expiresAt: new Date(Date.now() + 86_400_000),
    user: {
      id: USER_ID,
      role: 'USER' as const,
      status: 'ACTIVE' as const,
      passwordHash: CURRENT_PASSWORD_HASH
    }
  };
}

function dependencies(
  transaction: Prisma.TransactionClient,
  overrides: Partial<PasswordChangeDependencies> = {}
): PasswordChangeDependencies {
  return {
    findActiveSession: async () => activeSession(),
    comparePassword: async () => true,
    hashPassword: async () => 'new-password-hash',
    runInTransaction: async (callback) => callback(transaction),
    ...overrides
  };
}

describe('changement de mot de passe', () => {
  it('refuse un mot de passe actuel incorrect avant toute transaction', async () => {
    let transactionCalled = false;
    const serviceDependencies = dependencies({} as Prisma.TransactionClient, {
      comparePassword: async () => false,
      runInTransaction: async () => {
        transactionCalled = true;
        throw new Error('La transaction ne doit pas être appelée.');
      }
    });

    await assert.rejects(
      () =>
        authService.changePassword(
          USER_ID,
          passwordChangeInput,
          passwordChangeContext,
          serviceDependencies
        ),
      (error: unknown) => {
        assert.ok(error instanceof ApiError);
        assert.equal(error.statusCode, 400);
        assert.equal(error.errorCode, 'CURRENT_PASSWORD_INVALID');
        return true;
      }
    );
    assert.equal(transactionCalled, false);
  });

  it('change le secret, invalide les liens et révoque uniquement les autres sessions', async () => {
    const session = activeSession();

    const userUpdates: Array<Prisma.UserUpdateManyArgs> = [];
    const sessionUpdates: Array<Prisma.SessionUpdateManyArgs> = [];
    const resetTokenUpdates: Array<Prisma.PasswordResetTokenUpdateManyArgs> = [];
    const auditCreates: Array<Prisma.AdminLogCreateArgs> = [];

    const transaction = {
      user: {
        updateMany: async (args: Prisma.UserUpdateManyArgs) => {
          userUpdates.push(args);
          return { count: 1 };
        }
      },
      session: {
        updateMany: async (args: Prisma.SessionUpdateManyArgs) => {
          sessionUpdates.push(args);
          return { count: sessionUpdates.length === 1 ? 1 : 2 };
        }
      },
      passwordResetToken: {
        updateMany: async (args: Prisma.PasswordResetTokenUpdateManyArgs) => {
          resetTokenUpdates.push(args);
          return { count: 3 };
        }
      },
      adminLog: {
        create: async (args: Prisma.AdminLogCreateArgs) => {
          auditCreates.push(args);
          return { id: 'audit-id' };
        }
      }
    } as unknown as Prisma.TransactionClient;
    const serviceDependencies = dependencies(transaction, {
      findActiveSession: async () => session
    });

    const result = await authService.changePassword(
      USER_ID,
      passwordChangeInput,
      passwordChangeContext,
      serviceDependencies
    );

    assert.equal(result.currentSessionPreserved, true);
    assert.equal(result.revokedSessionCount, 2);
    assert.match(result.refreshToken, new RegExp(`^${SESSION_ID}\\.`));
    assert.equal(typeof result.accessToken, 'string');

    assert.equal(userUpdates.length, 1);
    assert.equal(userUpdates[0]?.data.passwordHash, 'new-password-hash');
    assert.equal(sessionUpdates.length, 2);
    assert.deepEqual(sessionUpdates[1]?.where?.id, { not: SESSION_ID });
    assert.equal(sessionUpdates[1]?.data.revokeReason, 'PASSWORD_CHANGED');
    assert.equal(resetTokenUpdates.length, 1);
    assert.deepEqual(resetTokenUpdates[0]?.where, { userId: USER_ID, usedAt: null });
    assert.equal(auditCreates.length, 1);
    assert.equal(auditCreates[0]?.data.action, 'PASSWORD_CHANGED');
    assert.equal(auditCreates[0]?.data.actorId, USER_ID);
    assert.deepEqual(auditCreates[0]?.data.after, {
      currentSessionPreserved: true,
      revokedSessionCount: 2
    });
  });

  it('détecte une modification concurrente du mot de passe', async () => {
    let sessionUpdateCalled = false;
    const transaction = {
      user: { updateMany: async () => ({ count: 0 }) },
      session: {
        updateMany: async () => {
          sessionUpdateCalled = true;
          return { count: 1 };
        }
      }
    } as unknown as Prisma.TransactionClient;
    const serviceDependencies = dependencies(transaction);

    await assert.rejects(
      () =>
        authService.changePassword(
          USER_ID,
          passwordChangeInput,
          passwordChangeContext,
          serviceDependencies
        ),
      (error: unknown) => {
        assert.ok(error instanceof ApiError);
        assert.equal(error.statusCode, 409);
        assert.equal(error.errorCode, 'PASSWORD_CHANGE_CONFLICT');
        return true;
      }
    );
    assert.equal(sessionUpdateCalled, false);
  });
});
