import { successResponse } from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/apiError.js';
import { User } from '../users/user.model.js';
import { SellerVerificationRequest } from './sellerVerification.model.js';
import { createAdminLog } from '../auditLogs/adminLog.service.js';

export const requestSellerVerification = asyncHandler(async (req, res) => {
  if (req.user.status !== 'ACTIVE') throw new ApiError(403, 'Votre compte ne peut pas demander la vérification.', 'ACCOUNT_NOT_ACTIVE');
  if (!req.user.phoneVerified) throw new ApiError(403, 'Le téléphone doit être vérifié.', 'PHONE_NOT_VERIFIED');
  if (!req.user.fullName) throw new ApiError(400, 'Le nom complet est obligatoire.', 'FULL_NAME_REQUIRED');

  const existing = await SellerVerificationRequest.findOne({ userId: req.user._id, status: 'PENDING' });
  if (existing) throw new ApiError(409, 'Une demande de vérification est déjà en attente.', 'SELLER_REQUEST_ALREADY_PENDING');

  const request = await SellerVerificationRequest.create({
    userId: req.user._id,
    fullName: req.user.fullName,
    phone: req.user.phone,
    avatarUrl: req.validated.body.avatarUrl,
    commune: req.validated.body.commune,
    quartier: req.validated.body.quartier,
    note: req.validated.body.note || null
  });

  req.user.avatarUrl = req.validated.body.avatarUrl;
  req.user.commune = req.validated.body.commune;
  req.user.quartier = req.validated.body.quartier;
  req.user.sellerVerificationStatus = 'PENDING';
  req.user.sellerVerificationRequestedAt = new Date();
  await req.user.save();

  return successResponse(res, { statusCode: 201, message: 'Demande de vérification vendeur envoyée.', data: request });
});

export const getMySellerVerification = asyncHandler(async (req, res) => {
  const request = await SellerVerificationRequest.findOne({ userId: req.user._id }).sort({ createdAt: -1 });
  return successResponse(res, { message: 'Statut de vérification vendeur.', data: { status: req.user.sellerVerificationStatus, request } });
});

export const approveSellerVerification = asyncHandler(async (req, res) => {
  const request = await SellerVerificationRequest.findOne({ _id: req.params.id, status: 'PENDING' });
  if (!request) throw new ApiError(404, 'Demande de vérification introuvable ou déjà traitée.', 'SELLER_REQUEST_NOT_FOUND');

  const user = await User.findById(request.userId);
  if (!user || user.status === 'DELETED') throw new ApiError(404, 'Utilisateur introuvable.', 'USER_NOT_FOUND');

  const before = { isVerifiedSeller: user.isVerifiedSeller, sellerVerificationStatus: user.sellerVerificationStatus };

  request.status = 'APPROVED';
  request.reviewedBy = req.user._id;
  request.reviewedAt = new Date();
  await request.save();

  user.isVerifiedSeller = true;
  user.sellerVerificationStatus = 'APPROVED';
  user.sellerVerifiedAt = new Date();
  user.sellerVerificationRejectedReason = null;
  await user.save();

  await createAdminLog({
    req,
    adminId: req.user._id,
    action: 'SELLER_VERIFICATION_APPROVED',
    targetType: 'USER',
    targetId: user._id,
    before,
    after: { isVerifiedSeller: true, sellerVerificationStatus: 'APPROVED', requestId: request._id }
  });

  return successResponse(res, { message: 'Vendeur vérifié approuvé.', data: request });
});

export const rejectSellerVerification = asyncHandler(async (req, res) => {
  const request = await SellerVerificationRequest.findOne({ _id: req.params.id, status: 'PENDING' });
  if (!request) throw new ApiError(404, 'Demande de vérification introuvable ou déjà traitée.', 'SELLER_REQUEST_NOT_FOUND');

  const user = await User.findById(request.userId);
  if (!user || user.status === 'DELETED') throw new ApiError(404, 'Utilisateur introuvable.', 'USER_NOT_FOUND');

  const before = { isVerifiedSeller: user.isVerifiedSeller, sellerVerificationStatus: user.sellerVerificationStatus };

  request.status = 'REJECTED';
  request.reviewedBy = req.user._id;
  request.reviewedAt = new Date();
  request.rejectionReason = req.validated.body.reason;
  await request.save();

  user.isVerifiedSeller = false;
  user.sellerVerificationStatus = 'REJECTED';
  user.sellerVerificationRejectedReason = req.validated.body.reason;
  await user.save();

  await createAdminLog({
    req,
    adminId: req.user._id,
    action: 'SELLER_VERIFICATION_REJECTED',
    targetType: 'USER',
    targetId: user._id,
    before,
    after: { isVerifiedSeller: false, sellerVerificationStatus: 'REJECTED', reason: req.validated.body.reason, requestId: request._id }
  });

  return successResponse(res, { message: 'Demande vendeur rejetée.', data: request });
});

export const removeVerifiedBadge = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user || user.status === 'DELETED') throw new ApiError(404, 'Utilisateur introuvable.', 'USER_NOT_FOUND');

  const before = { isVerifiedSeller: user.isVerifiedSeller, sellerVerificationStatus: user.sellerVerificationStatus };
  user.isVerifiedSeller = false;
  user.sellerVerificationStatus = 'REMOVED';
  user.sellerVerificationRejectedReason = 'Badge retiré par l’administration.';
  await user.save();

  await createAdminLog({
    req,
    adminId: req.user._id,
    action: 'SELLER_VERIFIED_BADGE_REMOVED',
    targetType: 'USER',
    targetId: user._id,
    before,
    after: { isVerifiedSeller: false, sellerVerificationStatus: 'REMOVED' }
  });

  return successResponse(res, { message: 'Badge vendeur vérifié retiré.', data: { userId: user._id, isVerifiedSeller: false } });
});
