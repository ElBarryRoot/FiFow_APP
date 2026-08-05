import mongoose from 'mongoose';
import { successResponse } from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/apiError.js';
import { generateReference } from '../../utils/generateReference.js';
import { slugify } from '../../utils/slug.js';
import { Product } from '../products/product.model.js';
import { Payment } from '../payments/payment.model.js';
import { buildMockPaymentIntent } from '../payments/paymentProvider.service.js';
import { Boost } from './boost.model.js';
import { BoostPlan } from './boostPlan.model.js';
import { createAdminLog } from '../auditLogs/adminLog.service.js';

function assertProductBoostable(product, user) {
  if (!product) throw new ApiError(404, 'Produit introuvable.', 'PRODUCT_NOT_FOUND');
  if (product.sellerId.toString() !== user._id.toString()) {
    throw new ApiError(403, 'Vous ne pouvez booster que vos propres produits.', 'BOOST_OWNER_FORBIDDEN');
  }
  if (['SUSPENDED', 'BANNED', 'DELETED'].includes(user.status)) {
    throw new ApiError(403, 'Votre compte ne peut pas acheter de boost.', 'USER_CANNOT_BOOST');
  }
  if (product.status !== 'AVAILABLE' || product.moderationStatus !== 'APPROVED' || product.archivedAt || product.deletedAt) {
    throw new ApiError(400, 'Ce produit ne peut pas être boosté.', 'PRODUCT_NOT_BOOSTABLE');
  }
  if (product.reportsCount >= 5) {
    throw new ApiError(400, 'Ce produit a trop de signalements pour être boosté.', 'PRODUCT_TOO_REPORTED');
  }
}

export const listBoostPlans = asyncHandler(async (req, res) => {
  const filter = { archivedAt: null };
  if (req.validated.query.activeOnly === 'true') filter.isActive = true;
  const plans = await BoostPlan.find(filter).sort({ price: 1, durationHours: 1 });
  return successResponse(res, { message: 'Packs de boost.', data: plans });
});

export const createProductBoost = asyncHandler(async (req, res) => {
  const { boostPlanId, provider, phone } = req.validated.body;
  const product = await Product.findById(req.params.id);
  assertProductBoostable(product, req.user);

  const plan = await BoostPlan.findOne({ _id: boostPlanId, isActive: true, archivedAt: null });
  if (!plan) throw new ApiError(404, 'Pack de boost introuvable ou inactif.', 'BOOST_PLAN_NOT_FOUND');

  const activeBoost = await Boost.findOne({ productId: product._id, status: { $in: ['ACTIVE', 'PENDING_PAYMENT'] }, archivedAt: null });
  if (activeBoost) throw new ApiError(400, 'Ce produit possède déjà un boost actif ou en attente de paiement.', 'BOOST_ALREADY_EXISTS');

  const session = await mongoose.startSession();
  let boost;
  let payment;

  await session.withTransaction(async () => {
    const endsAt = new Date(Date.now() + plan.durationHours * 60 * 60 * 1000);
    [boost] = await Boost.create(
      [{ productId: product._id, sellerId: req.user._id, boostPlanId: plan._id, status: 'PENDING_PAYMENT', endsAt }],
      { session }
    );

    [payment] = await Payment.create(
      [{
        userId: req.user._id,
        type: 'BOOST',
        amount: plan.price,
        currency: plan.currency,
        provider,
        phone,
        internalReference: generateReference('BSTPAY'),
        status: 'PROCESSING',
        relatedModel: 'Boost',
        relatedId: boost._id,
        metadata: { productId: product._id, boostPlanId: plan._id, placement: plan.placement, durationHours: plan.durationHours }
      }],
      { session }
    );

    boost.paymentId = payment._id;
    await boost.save({ session });
  });

  await session.endSession();

  return successResponse(res, {
    statusCode: 201,
    message: 'Boost créé. Activation après confirmation du paiement serveur.',
    data: { boost, payment, paymentIntent: buildMockPaymentIntent(payment) }
  });
});

export const listMyBoosts = asyncHandler(async (req, res) => {
  const { page, limit, status } = req.validated.query;
  const skip = (page - 1) * limit;
  const filter = { sellerId: req.user._id };
  if (status) filter.status = status;

  const [boosts, total] = await Promise.all([
    Boost.find(filter)
      .populate('productId', 'title price status moderationStatus images')
      .populate('boostPlanId')
      .populate('paymentId', 'amount status internalReference provider')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Boost.countDocuments(filter)
  ]);

  return successResponse(res, { message: 'Mes boosts.', data: boosts, meta: { page, limit, total, pages: Math.ceil(total / limit) } });
});

export const adminListBoosts = asyncHandler(async (req, res) => {
  const { page, limit, status } = req.validated.query;
  const skip = (page - 1) * limit;
  const filter = {};
  if (status) filter.status = status;

  const [boosts, total] = await Promise.all([
    Boost.find(filter)
      .populate('sellerId', 'fullName phone status')
      .populate('productId', 'title status moderationStatus')
      .populate('boostPlanId')
      .populate('paymentId', 'amount status internalReference provider')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Boost.countDocuments(filter)
  ]);

  return successResponse(res, { message: 'Boosts admin.', data: boosts, meta: { page, limit, total, pages: Math.ceil(total / limit) } });
});

export const cancelBoost = asyncHandler(async (req, res) => {
  const boost = await Boost.findById(req.params.id);
  if (!boost) throw new ApiError(404, 'Boost introuvable.', 'BOOST_NOT_FOUND');
  if (['CANCELLED', 'EXPIRED'].includes(boost.status)) {
    throw new ApiError(400, 'Ce boost ne peut plus être annulé.', 'BOOST_NOT_CANCELLABLE');
  }

  boost.status = 'CANCELLED';
  boost.cancelReason = req.validated.body.reason;
  await boost.save();

  await Product.updateOne(
    { _id: boost.productId, activeBoostId: boost._id },
    { $set: { isBoosted: false, activeBoostId: null, boostedUntil: null } }
  );

  await createAdminLog({
    adminId: req.user._id,
    action: 'BOOST_CANCELLED',
    targetType: 'BOOST',
    targetId: boost._id,
    after: { status: boost.status, reason: boost.cancelReason }
  });

  return successResponse(res, { message: 'Boost annulé.', data: boost });
});

export const createBoostPlan = asyncHandler(async (req, res) => {
  const payload = req.validated.body;
  const plan = await BoostPlan.create({ ...payload, slug: payload.slug || slugify(payload.name) });
  await createAdminLog({ adminId: req.user._id, action: 'BOOST_PLAN_CREATED', targetType: 'BOOST_PLAN', targetId: plan._id, after: plan.toObject() });
  return successResponse(res, { statusCode: 201, message: 'Pack de boost créé.', data: plan });
});

export const updateBoostPlan = asyncHandler(async (req, res) => {
  const plan = await BoostPlan.findById(req.params.id);
  if (!plan) throw new ApiError(404, 'Pack de boost introuvable.', 'BOOST_PLAN_NOT_FOUND');
  const before = plan.toObject();
  Object.assign(plan, req.validated.body);
  await plan.save();
  await createAdminLog({ adminId: req.user._id, action: 'BOOST_PLAN_UPDATED', targetType: 'BOOST_PLAN', targetId: plan._id, before, after: plan.toObject() });
  return successResponse(res, { message: 'Pack de boost mis à jour.', data: plan });
});

export const archiveBoostPlan = asyncHandler(async (req, res) => {
  const plan = await BoostPlan.findById(req.params.id);
  if (!plan) throw new ApiError(404, 'Pack de boost introuvable.', 'BOOST_PLAN_NOT_FOUND');
  plan.isActive = false;
  plan.archivedAt = new Date();
  await plan.save();
  await createAdminLog({ adminId: req.user._id, action: 'BOOST_PLAN_ARCHIVED', targetType: 'BOOST_PLAN', targetId: plan._id, after: { archivedAt: plan.archivedAt } });
  return successResponse(res, { message: 'Pack de boost archivé.', data: plan });
});
