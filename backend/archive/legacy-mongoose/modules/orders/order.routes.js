import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { validateObjectId } from '../../middlewares/validateObjectId.middleware.js';
import { orderParticipant } from './order.middleware.js';
import { cancelOrderSchema, createOrderSchema, disputeOrderSchema, orderListSchema } from './order.validator.js';
import { cancelOrder, completeOrder, createOrder, disputeOrder, getOrder, listMyOrders, reserveOrder } from './order.controller.js';

const router = Router();

router.post('/', authenticate, validate(createOrderSchema), createOrder);
router.get('/me', authenticate, validate(orderListSchema), listMyOrders);
router.get('/:id', authenticate, validateObjectId('id'), orderParticipant, getOrder);
router.patch('/:id/reserve', authenticate, validateObjectId('id'), orderParticipant, reserveOrder);
router.patch('/:id/complete', authenticate, validateObjectId('id'), orderParticipant, completeOrder);
router.patch('/:id/cancel', authenticate, validateObjectId('id'), orderParticipant, validate(cancelOrderSchema), cancelOrder);
router.patch('/:id/dispute', authenticate, validateObjectId('id'), orderParticipant, validate(disputeOrderSchema), disputeOrder);

export default router;
