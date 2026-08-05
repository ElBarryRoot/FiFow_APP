import { successResponse } from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/apiError.js';
import { generateReference } from '../../utils/generateReference.js';
import { Payment } from './payment.model.js';
import { buildMockPaymentIntent, verifyWebhookSignature } from './paymentProvider.service.js';
import { applyFailedPayment, applySuccessfulPayment } from './payment.service.js';

export const initiatePayment = asyncHandler(async (req, res) => {
  const payload = req.validated.body;

  const payment = await Payment.create({
    userId: req.user._id,
    type: payload.type,
    amount: payload.amount,
    provider: payload.provider,
    phone: payload.phone,
    internalReference: generateReference('PAY'),
    relatedModel: payload.relatedModel || null,
    relatedId: payload.relatedId || null,
    metadata: payload.metadata || {},
    status: 'PROCESSING'
  });

  return successResponse(res, {
    statusCode: 201,
    message: 'Paiement initialisé. Le succès doit être confirmé par webhook serveur.',
    data: { payment, paymentIntent: buildMockPaymentIntent(payment) }
  });
});

export const getPayment = asyncHandler(async (req, res) => {
  const filter = { _id: req.params.id };
  if (!['ADMIN', 'SUPER_ADMIN', 'MODERATOR'].includes(req.user.role)) filter.userId = req.user._id;

  const payment = await Payment.findOne(filter).select('+callbackPayload');
  if (!payment) throw new ApiError(404, 'Paiement introuvable.', 'PAYMENT_NOT_FOUND');

  return successResponse(res, { message: 'Détail paiement.', data: payment });
});

export const listMyPayments = asyncHandler(async (req, res) => {
  const { page, limit, status, type } = req.validated.query;
  const skip = (page - 1) * limit;
  const filter = { userId: req.user._id };
  if (status) filter.status = status;
  if (type) filter.type = type;

  const [payments, total] = await Promise.all([
    Payment.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Payment.countDocuments(filter)
  ]);

  return successResponse(res, { message: 'Mes paiements.', data: payments, meta: { page, limit, total, pages: Math.ceil(total / limit) } });
});

export const handlePaymentWebhook = asyncHandler(async (req, res) => {
  if (!verifyWebhookSignature(req)) {
    throw new ApiError(401, 'Signature webhook paiement invalide.', 'INVALID_PAYMENT_WEBHOOK_SIGNATURE');
  }

  const payload = req.validated.body;
  const payment = await Payment.findOne({ internalReference: payload.internalReference }).select('+callbackPayload');
  if (!payment) throw new ApiError(404, 'Paiement introuvable.', 'PAYMENT_NOT_FOUND');

  payment.providerTransactionId = payload.providerTransactionId || payment.providerTransactionId;
  payment.callbackPayload = { provider: req.params.provider, receivedAt: new Date(), payload };

  let updatedPayment;
  if (payload.status === 'SUCCESS') {
    await payment.save();
    updatedPayment = await applySuccessfulPayment(payment);
  } else {
    updatedPayment = await applyFailedPayment(payment, payload.status, payload.failureReason);
  }

  return successResponse(res, { message: 'Webhook paiement traité.', data: { id: updatedPayment._id, status: updatedPayment.status } });
});

export const adminListPayments = asyncHandler(async (req, res) => {
  const { page, limit, status, type, provider } = req.validated.query;
  const skip = (page - 1) * limit;
  const filter = {};
  if (status) filter.status = status;
  if (type) filter.type = type;
  if (provider) filter.provider = provider;

  const [payments, total] = await Promise.all([
    Payment.find(filter).populate('userId', 'fullName phone commune quartier status').sort({ createdAt: -1 }).skip(skip).limit(limit),
    Payment.countDocuments(filter)
  ]);

  return successResponse(res, { message: 'Paiements admin.', data: payments, meta: { page, limit, total, pages: Math.ceil(total / limit) } });
});
