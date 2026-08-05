import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { getPayment, handlePaymentWebhook, initiatePayment, listMyPayments } from './payment.controller.js';
import { getPaymentSchema, initiatePaymentSchema, listMyPaymentsSchema, paymentWebhookSchema } from './payment.validator.js';

const router = Router();

router.post('/initiate', authenticate, validate(initiatePaymentSchema), initiatePayment);
router.get('/me', authenticate, validate(listMyPaymentsSchema), listMyPayments);
router.get('/:id', authenticate, validate(getPaymentSchema), getPayment);
router.post('/webhook/:provider', validate(paymentWebhookSchema), handlePaymentWebhook);

export default router;
