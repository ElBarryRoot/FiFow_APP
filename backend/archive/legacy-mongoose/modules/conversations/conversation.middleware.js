import { ApiError } from '../../utils/apiError.js';
import { Conversation } from './conversation.model.js';

export async function participantConversation(req, _res, next) {
  try {
    const conversation = await Conversation.findById(req.params.id || req.params.conversationId);
    if (!conversation) return next(new ApiError(404, 'Conversation introuvable.', 'CONVERSATION_NOT_FOUND'));

    const isParticipant = conversation.participants.some((id) => id.toString() === req.user._id.toString());
    const isAdmin = ['MODERATOR', 'ADMIN', 'SUPER_ADMIN'].includes(req.user.role);

    if (!isParticipant && !(isAdmin && conversation.isReported)) {
      return next(new ApiError(403, 'Accès interdit à cette conversation.', 'CONVERSATION_FORBIDDEN'));
    }

    req.conversation = conversation;
    return next();
  } catch (error) {
    return next(error);
  }
}
