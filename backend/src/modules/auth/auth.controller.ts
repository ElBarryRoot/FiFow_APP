import type { CookieOptions, Request, Response } from 'express';
import { env, isProduction } from '../../config/env.js';
import { ApiError } from '../../shared/errors/api-error.js';
import { sendSuccess } from '../../shared/http/api-response.js';
import type {
  ChangePasswordInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput
} from './auth.schemas.js';
import { authService } from './auth.service.js';
import { refreshMaxAgeMs } from './token.service.js';

function inputBody<T>(request: Request) {
  return (request.validated as { body: T }).body;
}

function clientContext(request: Request) {
  const userAgent = request.get('user-agent');
  return {
    ipAddress: request.ip,
    userAgent,
    deviceName: userAgent?.slice(0, 120)
  };
}

const refreshCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'lax',
  path: '/api/v1/auth',
  maxAge: refreshMaxAgeMs()
};

function setRefreshCookie(response: Response, token: string) {
  response.cookie(env.REFRESH_COOKIE_NAME, token, refreshCookieOptions);
}

function clearRefreshCookie(response: Response) {
  response.clearCookie(env.REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/api/v1/auth'
  });
}

export const authController = {
  async register(request: Request, response: Response) {
    const result = await authService.register(
      inputBody<RegisterInput>(request),
      clientContext(request)
    );
    setRefreshCookie(response, result.refreshToken);
    return sendSuccess(response, {
      statusCode: 201,
      message: 'Compte créé. Vérifiez votre adresse email.',
      data: {
        user: result.user,
        accessToken: result.accessToken,
        accessTokenType: 'Bearer',
        emailVerificationRequired: result.emailVerificationRequired
      }
    });
  },

  async login(request: Request, response: Response) {
    const result = await authService.login(inputBody<LoginInput>(request), clientContext(request));
    setRefreshCookie(response, result.refreshToken);
    return sendSuccess(response, {
      message: 'Connexion réussie.',
      data: {
        user: result.user,
        accessToken: result.accessToken,
        accessTokenType: 'Bearer',
        emailVerificationRequired: result.emailVerificationRequired
      }
    });
  },

  async refresh(request: Request, response: Response) {
    const rawToken = request.cookies[env.REFRESH_COOKIE_NAME] as string | undefined;
    if (!rawToken) {
      throw new ApiError(401, 'Session invalide.', 'REFRESH_TOKEN_REQUIRED');
    }
    const result = await authService.refresh(rawToken, clientContext(request));
    setRefreshCookie(response, result.refreshToken);
    return sendSuccess(response, {
      message: 'Session renouvelée.',
      data: {
        accessToken: result.accessToken,
        accessTokenType: 'Bearer',
        emailVerificationRequired: result.emailVerificationRequired
      }
    });
  },

  async logout(request: Request, response: Response) {
    const rawToken = request.cookies[env.REFRESH_COOKIE_NAME] as string | undefined;
    await authService.logout(rawToken);
    clearRefreshCookie(response);
    return sendSuccess(response, { message: 'Déconnexion réussie.', data: null });
  },

  async logoutAll(request: Request, response: Response) {
    await authService.logoutAll(request.auth!.userId);
    clearRefreshCookie(response);
    return sendSuccess(response, {
      message: 'Toutes les sessions ont été déconnectées.',
      data: null
    });
  },

  async me(request: Request, response: Response) {
    return sendSuccess(response, {
      data: await authService.me(request.auth!.userId),
      message: 'Profil chargé.'
    });
  },

  async verifyEmail(request: Request, response: Response) {
    await authService.verifyEmail(inputBody<{ token: string }>(request).token);
    return sendSuccess(response, { data: null, message: 'Adresse email vérifiée.' });
  },

  async resendVerification(request: Request, response: Response) {
    await authService.resendVerification(request.auth!.userId);
    return sendSuccess(response, {
      data: null,
      message: 'Si nécessaire, un nouvel email de vérification a été envoyé.'
    });
  },

  async forgotPassword(request: Request, response: Response) {
    await authService.forgotPassword(inputBody<{ email: string }>(request).email);
    return sendSuccess(response, {
      data: null,
      message: 'Si ce compte existe, un email de réinitialisation a été envoyé.'
    });
  },

  async resetPassword(request: Request, response: Response) {
    await authService.resetPassword(inputBody<ResetPasswordInput>(request));
    clearRefreshCookie(response);
    return sendSuccess(response, {
      data: null,
      message: 'Mot de passe modifié. Reconnectez-vous.'
    });
  },

  async changePassword(request: Request, response: Response) {
    const result = await authService.changePassword(
      request.auth!.userId,
      inputBody<ChangePasswordInput>(request),
      {
        ...clientContext(request),
        sessionId: request.auth!.sessionId,
        requestId: request.requestId
      }
    );
    setRefreshCookie(response, result.refreshToken);
    return sendSuccess(response, {
      data: {
        accessToken: result.accessToken,
        accessTokenType: 'Bearer',
        currentSessionPreserved: result.currentSessionPreserved,
        revokedSessionCount: result.revokedSessionCount
      },
      message: 'Mot de passe modifié. Les autres sessions ont été déconnectées.'
    });
  }
};
