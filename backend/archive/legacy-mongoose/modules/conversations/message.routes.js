import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { validateObjectId } from '../../middlewares/validateObjectId.middleware.js';
import { reportConversationSchema } from './conversation.validator.js';
import { reportMessage } from './conversation.controller.js';

const router = Router();

router.post('/:id/report', authenticate, validateObjectId('id'), validate(reportConversationSchema), reportMessage);

export default router;
