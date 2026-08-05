import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { validateObjectId } from '../../middlewares/validateObjectId.middleware.js';
import { participantConversation } from './conversation.middleware.js';
import {
  archiveConversation,
  createOrGetConversation,
  getConversation,
  listConversations,
  markConversationRead,
  reportConversation,
  reportMessage,
  sendMessage
} from './conversation.controller.js';
import {
  conversationListSchema,
  createConversationSchema,
  createMessageSchema,
  reportConversationSchema
} from './conversation.validator.js';

const router = Router();

router.get('/', authenticate, validate(conversationListSchema), listConversations);
router.post('/', authenticate, validate(createConversationSchema), createOrGetConversation);
router.get('/:id', authenticate, validateObjectId('id'), participantConversation, getConversation);
router.post('/:id/messages', authenticate, validateObjectId('id'), participantConversation, validate(createMessageSchema), sendMessage);
router.patch('/:id/read', authenticate, validateObjectId('id'), participantConversation, markConversationRead);
router.post('/:id/archive', authenticate, validateObjectId('id'), participantConversation, archiveConversation);
router.post('/:id/report', authenticate, validateObjectId('id'), participantConversation, validate(reportConversationSchema), reportConversation);
router.post('/messages/:id/report', authenticate, validateObjectId('id'), validate(reportConversationSchema), reportMessage);

export default router;
