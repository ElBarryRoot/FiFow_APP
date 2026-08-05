import { Router } from 'express';
import { authController } from '../../modules/auth/auth.controller.js';
import { authenticate } from '../../modules/auth/auth.middleware.js';
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  verifyEmailSchema
} from '../../modules/auth/auth.schemas.js';
import { asyncHandler } from '../../shared/http/async-handler.js';
import { authRateLimit } from '../middlewares/rate-limit.middleware.js';
import { requireTrustedOrigin } from '../middlewares/trusted-origin.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';

export const authRoutes = Router();

authRoutes.post(
  '/register',
  authRateLimit,
  requireTrustedOrigin,
  validate(registerSchema),
  asyncHandler(authController.register)
);
authRoutes.post(
  '/login',
  authRateLimit,
  requireTrustedOrigin,
  validate(loginSchema),
  asyncHandler(authController.login)
);
authRoutes.post(
  '/refresh',
  authRateLimit,
  requireTrustedOrigin,
  asyncHandler(authController.refresh)
);
authRoutes.post(
  '/logout',
  requireTrustedOrigin,
  asyncHandler(authController.logout)
);
authRoutes.post(
  '/logout-all',
  requireTrustedOrigin,
  authenticate,
  asyncHandler(authController.logoutAll)
);
authRoutes.get('/me', authenticate, asyncHandler(authController.me));
authRoutes.post(
  '/verify-email',
  authRateLimit,
  validate(verifyEmailSchema),
  asyncHandler(authController.verifyEmail)
);
authRoutes.post(
  '/resend-verification',
  authRateLimit,
  authenticate,
  asyncHandler(authController.resendVerification)
);
authRoutes.post(
  '/forgot-password',
  authRateLimit,
  validate(forgotPasswordSchema),
  asyncHandler(authController.forgotPassword)
);
authRoutes.post(
  '/reset-password',
  authRateLimit,
  requireTrustedOrigin,
  validate(resetPasswordSchema),
  asyncHandler(authController.resetPassword)
);
authRoutes.post(
  '/change-password',
  authRateLimit,
  requireTrustedOrigin,
  authenticate,
  validate(changePasswordSchema),
  asyncHandler(authController.changePassword)
);
