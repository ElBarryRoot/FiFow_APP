import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authRateLimiter } from '../../middlewares/rateLimit.middleware.js';
import { refreshTokenSchema, sendOtpSchema, verifyOtpSchema } from './auth.validator.js';
import * as authController from './auth.controller.js';

const router = Router();

router.post('/send-otp', authRateLimiter, validate(sendOtpSchema), authController.sendOtp);
router.post('/verify-otp', authRateLimiter, validate(verifyOtpSchema), authController.verifyOtp);
router.post('/refresh-token', validate(refreshTokenSchema), authController.refreshToken);
router.post('/logout', authenticate, authController.logout);
router.post('/logout-all', authenticate, authController.logout);
router.get('/me', authenticate, authController.me);

export default router;
