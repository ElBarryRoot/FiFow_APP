import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { sellerVerificationRequestSchema } from './sellerVerification.validator.js';
import * as controller from './sellerVerification.controller.js';

const router = Router();

router.post('/request', authenticate, validate(sellerVerificationRequestSchema), controller.requestSellerVerification);
router.get('/me', authenticate, controller.getMySellerVerification);

export default router;
