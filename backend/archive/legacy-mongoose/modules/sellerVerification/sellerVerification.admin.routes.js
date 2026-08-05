import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireAdminRole } from '../../middlewares/requireRole.middleware.js';
import { validateObjectId } from '../../middlewares/validateObjectId.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { rejectSellerVerificationSchema } from './sellerVerification.validator.js';
import * as controller from './sellerVerification.controller.js';

const router = Router();

router.patch('/seller-verifications/:id/approve', authenticate, requireAdminRole, validateObjectId('id'), controller.approveSellerVerification);
router.patch('/seller-verifications/:id/reject', authenticate, requireAdminRole, validateObjectId('id'), validate(rejectSellerVerificationSchema), controller.rejectSellerVerification);
router.patch('/users/:id/remove-verified-badge', authenticate, requireAdminRole, validateObjectId('id'), controller.removeVerifiedBadge);

export default router;
