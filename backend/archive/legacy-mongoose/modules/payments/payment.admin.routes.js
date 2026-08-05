import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireAdminRole } from '../../middlewares/requireRole.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { adminListPayments } from './payment.controller.js';
import { adminListPaymentsSchema } from './payment.validator.js';

const router = Router();

router.get('/payments', authenticate, requireAdminRole, validate(adminListPaymentsSchema), adminListPayments);

export default router;
