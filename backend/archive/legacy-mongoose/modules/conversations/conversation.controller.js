import { successResponse } from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/apiError.js';
import { Product } from '../products/product.model.js';
import { Conversation } from './conversation.model.js';
import { Message } from './message.model.js';
import { Report } from '../reports/report.model.js';
import { createNotification } from '../notifications/notification.service.js';

function emitToConversation(req, conversationId, event, payload) {
  req.app.get('io')?.to(`conversation:${conversationId}`).emit(event, payload);
}

export const listConversations = asyncHandler(async (req, res) => {
  const { page, limit } = req.validated.query;
  const skip = (page - 1) * limit;
  const filter = { participants: req.user._id };

  const [conversations, total] = await Promise.all([
    Conversation.find(filter)
      .populate('productId', 'title price status moderationStatus images')
      .populate('buyerId', 'fullName avatarUrl commune quartier isVerifiedSeller')
      .populate('sellerId', 'fullName avatarUrl commune quartier isVerifiedSeller')
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .skip(skip)
      .limit(limit),
    Conversation.countDocuments(filter)
  ]);

  return successResponse(res, {
    message: 'Conversations utilisateur.',
    data: conversations,
    meta: { page, limit, total, pages: Math.ceil(total / limit) }
  });
});

export const createOrGetConversation = asyncHandler(async (req, res) => {
  const product = await Product.findOne({
    _id: req.validated.body.productId,
    archivedAt: null,
    deletedAt: null
  });

  if (!product || product.status !== 'AVAILABLE' || product.moderationStatus !== 'APPROVED') {
    throw new ApiError(404, 'Produit introuvable ou indisponible.', 'PRODUCT_NOT_AVAILABLE');
  }

  if (product.sellerId.toString() === req.user._id.toString()) {
    throw new ApiError(400, 'Vous ne pouvez pas ouvrir une conversation avec vous-même.', 'CANNOT_CHAT_WITH_SELF');
  }

  let conversation = await Conversation.findOne({ productId: product._id, buyerId: req.user._id, sellerId: product.sellerId });
  let created = false;

  if (!conversation) {
    conversation = await Conversation.create({
      productId: product._id,
      buyerId: req.user._id,
      sellerId: product.sellerId,
      participants: [req.user._id, product.sellerId],
      lastMessageAt: new Date()
    });
    created = true;
    await Product.updateOne({ _id: product._id }, { $inc: { conversationsCount: 1 } });
  }

  await conversation.populate('productId buyerId sellerId');
  return successResponse(res, { statusCode: created ? 201 : 200, message: 'Conversation prête.', data: conversation });
});

export const getConversation = asyncHandler(async (req, res) => {
  const conversation = await req.conversation.populate([
    { path: 'productId', select: 'title price status moderationStatus images sellerId' },
    { path: 'buyerId', select: 'fullName avatarUrl commune quartier isVerifiedSeller' },
    { path: 'sellerId', select: 'fullName avatarUrl commune quartier isVerifiedSeller' }
  ]);

  const messages = await Message.find({ conversationId: conversation._id, isDeleted: false })
    .populate('senderId', 'fullName avatarUrl')
    .sort({ createdAt: 1 })
    .limit(100);

  return successResponse(res, { message: 'Détail conversation.', data: { conversation, messages } });
});

export const sendMessage = asyncHandler(async (req, res) => {
  const conversation = req.conversation;

  if (conversation.status === 'BLOCKED') {
    throw new ApiError(403, 'Cette conversation est bloquée.', 'CONVERSATION_BLOCKED');
  }

  const message = await Message.create({
    conversationId: conversation._id,
    senderId: req.user._id,
    type: 'TEXT',
    text: req.validated.body.text
  });

  const senderIsBuyer = conversation.buyerId.toString() === req.user._id.toString();
  conversation.lastMessageId = message._id;
  conversation.lastMessageText = message.text.slice(0, 220);
  conversation.lastMessageAt = message.createdAt;
  if (senderIsBuyer) conversation.unreadCountSeller += 1;
  else conversation.unreadCountBuyer += 1;
  await conversation.save();

  const payload = await message.populate('senderId', 'fullName avatarUrl');
  emitToConversation(req, conversation._id, 'message:new', { conversationId: conversation._id, message: payload });

  const receiverId = senderIsBuyer ? conversation.sellerId : conversation.buyerId;
  await createNotification({
    userId: receiverId,
    type: 'NEW_MESSAGE',
    title: 'Nouveau message',
    body: message.text.slice(0, 120),
    data: { conversationId: conversation._id, messageId: message._id, productId: conversation.productId }
  });

  return successResponse(res, { statusCode: 201, message: 'Message envoyé.', data: payload });
});

export const markConversationRead = asyncHandler(async (req, res) => {
  const conversation = req.conversation;
  const isBuyer = conversation.buyerId.toString() === req.user._id.toString();

  await Message.updateMany(
    { conversationId: conversation._id, senderId: { $ne: req.user._id }, isRead: false },
    { $set: { isRead: true, readAt: new Date() } }
  );

  if (isBuyer) conversation.unreadCountBuyer = 0;
  else conversation.unreadCountSeller = 0;
  await conversation.save();

  emitToConversation(req, conversation._id, 'message:read', { conversationId: conversation._id, readerId: req.user._id });
  return successResponse(res, { message: 'Conversation marquée comme lue.', data: { read: true } });
});

export const archiveConversation = asyncHandler(async (req, res) => {
  const conversation = req.conversation;
  const userId = req.user._id.toString();

  if (conversation.buyerId.toString() === userId) conversation.buyerDeletedAt = new Date();
  if (conversation.sellerId.toString() === userId) conversation.sellerDeletedAt = new Date();
  if (!conversation.archivedBy.some((id) => id.toString() === userId)) conversation.archivedBy.push(req.user._id);
  await conversation.save();

  return successResponse(res, { message: 'Conversation archivée pour votre compte.', data: conversation });
});

export const reportConversation = asyncHandler(async (req, res) => {
  const conversation = req.conversation;
  const report = await Report.create({
    reporterId: req.user._id,
    targetType: 'CONVERSATION',
    targetId: conversation._id,
    reason: req.validated.body.reason,
    description: req.validated.body.description,
    priority: ['SCAM', 'BAD_BEHAVIOR', 'OFFENSIVE_CONTENT'].includes(req.validated.body.reason) ? 'HIGH' : 'MEDIUM'
  });

  conversation.isReported = true;
  conversation.reportCount += 1;
  if (conversation.status === 'ACTIVE') conversation.status = 'DISPUTED';
  await conversation.save();

  return successResponse(res, { statusCode: 201, message: 'Conversation signalée.', data: report });
});

export const reportMessage = asyncHandler(async (req, res) => {
  const message = await Message.findById(req.params.id).populate('conversationId');
  if (!message) throw new ApiError(404, 'Message introuvable.', 'MESSAGE_NOT_FOUND');

  const conversation = message.conversationId;
  const isParticipant = conversation.participants.some((id) => id.toString() === req.user._id.toString());
  if (!isParticipant) throw new ApiError(403, 'Vous ne pouvez pas signaler ce message.', 'MESSAGE_REPORT_FORBIDDEN');

  const report = await Report.create({
    reporterId: req.user._id,
    targetType: 'MESSAGE',
    targetId: message._id,
    reason: req.validated.body.reason,
    description: req.validated.body.description,
    priority: req.validated.body.reason === 'OFFENSIVE_CONTENT' ? 'HIGH' : 'MEDIUM'
  });

  message.isReported = true;
  message.reportCount += 1;
  await message.save();
  await Conversation.updateOne({ _id: conversation._id }, { $set: { isReported: true, status: 'DISPUTED' }, $inc: { reportCount: 1 } });

  return successResponse(res, { statusCode: 201, message: 'Message signalé.', data: report });
});
