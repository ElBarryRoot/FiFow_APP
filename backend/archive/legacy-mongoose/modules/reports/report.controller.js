import { successResponse } from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/apiError.js';
import { Report } from './report.model.js';
import { Product } from '../products/product.model.js';
import { User } from '../users/user.model.js';
import { Message } from '../conversations/message.model.js';
import { Conversation } from '../conversations/conversation.model.js';
import { ModerationAction } from '../moderation/moderationAction.model.js';
import { Review } from '../reviews/review.model.js';
import { createAdminLog } from '../auditLogs/adminLog.service.js';

const HIGH_PRIORITY_REASONS = new Set(['SCAM', 'FORBIDDEN_PRODUCT', 'OFFENSIVE_CONTENT', 'BAD_BEHAVIOR']);

async function ensureReportTargetAccess({ targetType, targetId, userId }) {
  if (targetType === 'PRODUCT') {
    const product = await Product.findById(targetId);
    if (!product) throw new ApiError(404, 'Produit introuvable.', 'REPORT_TARGET_NOT_FOUND');
    if (product.sellerId.toString() === userId.toString()) throw new ApiError(400, 'Vous ne pouvez pas signaler votre propre produit.', 'REPORT_OWN_PRODUCT');
    return product;
  }

  if (targetType === 'USER') {
    const user = await User.findById(targetId);
    if (!user) throw new ApiError(404, 'Utilisateur introuvable.', 'REPORT_TARGET_NOT_FOUND');
    if (user._id.toString() === userId.toString()) throw new ApiError(400, 'Vous ne pouvez pas vous signaler vous-même.', 'REPORT_SELF');
    return user;
  }

  if (targetType === 'MESSAGE') {
    const message = await Message.findById(targetId).populate('conversationId');
    if (!message) throw new ApiError(404, 'Message introuvable.', 'REPORT_TARGET_NOT_FOUND');
    const isParticipant = message.conversationId.participants.some((id) => id.toString() === userId.toString());
    if (!isParticipant) throw new ApiError(403, 'Vous ne pouvez pas signaler ce message.', 'REPORT_MESSAGE_FORBIDDEN');
    return message;
  }

  if (targetType === 'REVIEW') {
    const review = await Review.findById(targetId);
    if (!review) throw new ApiError(404, 'Avis introuvable.', 'REPORT_TARGET_NOT_FOUND');
    if (review.reviewerId.toString() === userId.toString()) throw new ApiError(400, 'Vous ne pouvez pas signaler votre propre avis.', 'REPORT_OWN_REVIEW');
    return review;
  }

  if (targetType === 'CONVERSATION') {
    const conversation = await Conversation.findById(targetId);
    if (!conversation) throw new ApiError(404, 'Conversation introuvable.', 'REPORT_TARGET_NOT_FOUND');
    const isParticipant = conversation.participants.some((id) => id.toString() === userId.toString());
    if (!isParticipant) throw new ApiError(403, 'Vous ne pouvez pas signaler cette conversation.', 'REPORT_CONVERSATION_FORBIDDEN');
    return conversation;
  }

  return null;
}

export const createReport = asyncHandler(async (req, res) => {
  const payload = req.validated.body;
  await ensureReportTargetAccess({ ...payload, userId: req.user._id });

  const report = await Report.create({
    reporterId: req.user._id,
    targetType: payload.targetType,
    targetId: payload.targetId,
    reason: payload.reason,
    description: payload.description,
    priority: HIGH_PRIORITY_REASONS.has(payload.reason) ? 'HIGH' : 'MEDIUM'
  });

  if (payload.targetType === 'PRODUCT') {
    const product = await Product.findById(payload.targetId);
    product.reportsCount += 1;
    if (product.reportsCount >= 5) product.moderationStatus = 'HIDDEN';
    await product.save();
  }
  if (payload.targetType === 'USER') await User.updateOne({ _id: payload.targetId }, { $inc: { reportCount: 1 } });
  if (payload.targetType === 'MESSAGE') await Message.updateOne({ _id: payload.targetId }, { $set: { isReported: true }, $inc: { reportCount: 1 } });
  if (payload.targetType === 'REVIEW') await Review.updateOne({ _id: payload.targetId }, { $set: { isReported: true }, $inc: { reportCount: 1 } });
  if (payload.targetType === 'CONVERSATION') await Conversation.updateOne({ _id: payload.targetId }, { $set: { isReported: true, status: 'DISPUTED' }, $inc: { reportCount: 1 } });

  return successResponse(res, { statusCode: 201, message: 'Signalement créé.', data: report });
});

export const listReports = asyncHandler(async (req, res) => {
  const { page, limit, status, priority, targetType } = req.validated.query;
  const skip = (page - 1) * limit;
  const filter = {};
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (targetType) filter.targetType = targetType;

  const [reports, total] = await Promise.all([
    Report.find(filter)
      .populate('reporterId', 'fullName phone commune quartier status')
      .populate('assignedTo', 'fullName role')
      .sort({ priority: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Report.countDocuments(filter)
  ]);

  return successResponse(res, { message: 'Liste des signalements.', data: reports, meta: { page, limit, total, pages: Math.ceil(total / limit) } });
});

export const getReport = asyncHandler(async (req, res) => {
  const report = await Report.findById(req.params.id)
    .populate('reporterId', 'fullName phone commune quartier status')
    .populate('assignedTo', 'fullName role');
  if (!report) throw new ApiError(404, 'Signalement introuvable.', 'REPORT_NOT_FOUND');
  return successResponse(res, { message: 'Détail signalement.', data: report });
});

export const assignReport = asyncHandler(async (req, res) => {
  const report = await Report.findById(req.params.id);
  if (!report) throw new ApiError(404, 'Signalement introuvable.', 'REPORT_NOT_FOUND');

  report.assignedTo = req.validated.body.assignedTo || req.user._id;
  if (report.status === 'OPEN') report.status = 'UNDER_REVIEW';
  await report.save();

  await createAdminLog({ req, adminId: req.user._id, action: 'REPORT_ASSIGNED', targetType: 'REPORT', targetId: report._id, after: report.toObject() });
  return successResponse(res, { message: 'Signalement assigné.', data: report });
});

export const resolveReport = asyncHandler(async (req, res) => {
  const report = await Report.findById(req.params.id);
  if (!report) throw new ApiError(404, 'Signalement introuvable.', 'REPORT_NOT_FOUND');

  const before = report.toObject();
  report.status = req.validated.body.status;
  report.adminDecision = req.validated.body.adminDecision;
  report.adminNote = req.validated.body.adminNote || null;
  report.assignedTo = report.assignedTo || req.user._id;
  report.resolvedAt = new Date();
  await report.save();

  await createAdminLog({ req, adminId: req.user._id, action: 'REPORT_RESOLVED', targetType: 'REPORT', targetId: report._id, before, after: report.toObject() });
  return successResponse(res, { message: 'Signalement traité.', data: report });
});

export const createModerationAction = asyncHandler(async (req, res) => {
  const payload = req.validated.body;
  const action = await ModerationAction.create({ moderatorId: req.user._id, ...payload });

  if (payload.targetType === 'PRODUCT') {
    if (payload.action === 'HIDE_PRODUCT') await Product.updateOne({ _id: payload.targetId }, { $set: { moderationStatus: 'HIDDEN', isBoosted: false, activeBoostId: null } });
    if (payload.action === 'ARCHIVE_PRODUCT') await Product.updateOne({ _id: payload.targetId }, { $set: { status: 'ARCHIVED', archivedAt: new Date(), isBoosted: false, activeBoostId: null } });
    if (payload.action === 'RESTORE_PRODUCT') await Product.updateOne({ _id: payload.targetId }, { $set: { status: 'AVAILABLE', moderationStatus: 'APPROVED', archivedAt: null } });
  }

  if (payload.targetType === 'USER') {
    if (payload.action === 'SUSPEND_USER') await User.updateOne({ _id: payload.targetId }, { $set: { status: 'SUSPENDED' } });
    if (payload.action === 'BAN_USER') await User.updateOne({ _id: payload.targetId }, { $set: { status: 'BANNED' } });
    if (payload.action === 'REMOVE_VERIFIED_BADGE') {
      await User.updateOne({ _id: payload.targetId }, { $set: { isVerifiedSeller: false, sellerVerificationStatus: 'REMOVED' } });
    }
  }

  if (payload.targetType === 'REVIEW') {
    if (payload.action === 'HIDE_REVIEW') await Review.updateOne({ _id: payload.targetId }, { $set: { status: 'HIDDEN', hiddenAt: new Date(), hiddenBy: req.user._id, hiddenReason: payload.reason } });
    if (payload.action === 'RESTORE_REVIEW') await Review.updateOne({ _id: payload.targetId }, { $set: { status: 'PUBLISHED', hiddenAt: null, hiddenBy: null, hiddenReason: null } });
  }

  if (payload.targetType === 'CONVERSATION' && payload.action === 'BLOCK_CONVERSATION') {
    await Conversation.updateOne({ _id: payload.targetId }, { $set: { status: 'BLOCKED' } });
  }

  await createAdminLog({ req, adminId: req.user._id, action: 'MODERATION_ACTION_CREATED', targetType: payload.targetType, targetId: payload.targetId, after: action.toObject() });

  return successResponse(res, { statusCode: 201, message: 'Action de modération appliquée.', data: action });
});
