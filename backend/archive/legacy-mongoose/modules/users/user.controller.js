import { successResponse } from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/apiError.js';
import { User } from './user.model.js';
import { sanitizeUser } from '../auth/auth.service.js';
import { Report } from '../reports/report.model.js';
import { UserBlock } from '../blocks/userBlock.model.js';
import { createAdminLog } from '../auditLogs/adminLog.service.js';

export const getMe = asyncHandler(async (req, res) => {
  return successResponse(res, { message: 'Profil utilisateur.', data: sanitizeUser(req.user) });
});

export const updateMe = asyncHandler(async (req, res) => {
  const before = sanitizeUser(req.user);
  Object.assign(req.user, req.validated.body);
  await req.user.save();
  return successResponse(res, { message: 'Profil mis à jour.', data: sanitizeUser(req.user), meta: { before } });
});

export const archiveMe = asyncHandler(async (req, res) => {
  req.user.status = 'DELETED';
  req.user.deletedAt = new Date();
  req.user.refreshTokenHash = null;
  await req.user.save();
  return successResponse(res, { message: 'Compte archivé. Les données sont conservées pour audit.', data: null });
});

export const getPublicProfile = asyncHandler(async (req, res) => {
  const user = await User.findOne({ _id: req.params.id, status: { $ne: 'DELETED' } });
  if (!user) throw new ApiError(404, 'Utilisateur introuvable.', 'USER_NOT_FOUND');
  return successResponse(res, {
    message: 'Profil public.',
    data: {
      id: user._id,
      fullName: user.fullName,
      commune: user.commune,
      quartier: user.quartier,
      avatarUrl: user.avatarUrl,
      isVerifiedSeller: user.isVerifiedSeller,
      averageRating: user.averageRating,
      totalReviews: user.totalReviews,
      createdAt: user.createdAt
    }
  });
});

export const reportUser = asyncHandler(async (req, res) => {
  if (req.user._id.toString() === req.params.id) {
    throw new ApiError(400, 'Vous ne pouvez pas signaler votre propre compte.', 'SELF_REPORT_NOT_ALLOWED');
  }

  const targetUser = await User.findOne({ _id: req.params.id, status: { $ne: 'DELETED' } });
  if (!targetUser) throw new ApiError(404, 'Utilisateur introuvable.', 'USER_NOT_FOUND');

  const report = await Report.create({
    reporterId: req.user._id,
    targetType: 'USER',
    targetId: targetUser._id,
    reason: req.validated.body.reason,
    description: req.validated.body.description || null,
    priority: req.validated.body.reason === 'SCAM' ? 'HIGH' : 'MEDIUM'
  });

  targetUser.reportCount += 1;
  if (targetUser.reportCount >= 3) targetUser.isUnderWatch = true;
  await targetUser.save();

  await createAdminLog({
    req,
    adminId: req.user._id,
    action: 'USER_REPORTED',
    targetType: 'USER',
    targetId: targetUser._id,
    after: { reportId: report._id, reason: report.reason }
  });

  return successResponse(res, { statusCode: 201, message: 'Utilisateur signalé avec succès.', data: report });
});

export const blockUser = asyncHandler(async (req, res) => {
  if (req.user._id.toString() === req.params.id) {
    throw new ApiError(400, 'Vous ne pouvez pas vous bloquer vous-même.', 'SELF_BLOCK_NOT_ALLOWED');
  }

  const targetUser = await User.findOne({ _id: req.params.id, status: { $ne: 'DELETED' } });
  if (!targetUser) throw new ApiError(404, 'Utilisateur introuvable.', 'USER_NOT_FOUND');

  const block = await UserBlock.findOneAndUpdate(
    { blockerId: req.user._id, blockedId: targetUser._id },
    { blockerId: req.user._id, blockedId: targetUser._id, reason: req.validated.body?.reason || null, archivedAt: null },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return successResponse(res, { statusCode: 201, message: 'Utilisateur bloqué.', data: block });
});

export const unblockUser = asyncHandler(async (req, res) => {
  const block = await UserBlock.findOneAndUpdate(
    { blockerId: req.user._id, blockedId: req.params.id, archivedAt: null },
    { archivedAt: new Date() },
    { new: true }
  );

  if (!block) throw new ApiError(404, 'Blocage introuvable.', 'BLOCK_NOT_FOUND');
  return successResponse(res, { message: 'Utilisateur débloqué.', data: block });
});
