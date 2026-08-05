import mongoose from 'mongoose';
import { successResponse } from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/apiError.js';
import { Product } from '../products/product.model.js';
import { Conversation } from '../conversations/conversation.model.js';
import { Order } from './order.model.js';
import { createNotification } from '../notifications/notification.service.js';

function isBuyer(order, user) {
  return order.buyerId.toString() === user._id.toString();
}

function isSeller(order, user) {
  return order.sellerId.toString() === user._id.toString();
}

export const createOrder = asyncHandler(async (req, res) => {
  const payload = req.validated.body;
  const product = await Product.findOne({
    _id: payload.productId,
    status: 'AVAILABLE',
    moderationStatus: 'APPROVED',
    archivedAt: null,
    deletedAt: null
  });

  if (!product) throw new ApiError(404, 'Produit introuvable ou indisponible.', 'PRODUCT_NOT_AVAILABLE');
  if (product.sellerId.toString() === req.user._id.toString()) {
    throw new ApiError(400, 'Vous ne pouvez pas commander votre propre produit.', 'CANNOT_ORDER_OWN_PRODUCT');
  }

  if (payload.conversationId) {
    const conversation = await Conversation.findById(payload.conversationId);
    const validConversation = conversation && conversation.productId.toString() === product._id.toString() && conversation.participants.some((id) => id.toString() === req.user._id.toString());
    if (!validConversation) throw new ApiError(400, 'Conversation invalide pour cette commande.', 'INVALID_ORDER_CONVERSATION');
  }

  const order = await Order.create({
    productId: product._id,
    buyerId: req.user._id,
    sellerId: product.sellerId,
    conversationId: payload.conversationId || null,
    priceAgreed: payload.priceAgreed,
    handoverMode: payload.handoverMode
  });

  await createNotification({
    userId: product.sellerId,
    type: 'PRODUCT_RESERVED',
    title: 'Nouvelle intention d’achat',
    body: 'Un acheteur souhaite réserver ou acheter votre produit.',
    data: { orderId: order._id, productId: product._id }
  });

  return successResponse(res, { statusCode: 201, message: 'Commande créée.', data: order });
});

export const listMyOrders = asyncHandler(async (req, res) => {
  const { page, limit, role, status } = req.validated.query;
  const skip = (page - 1) * limit;
  const filter = {};

  if (role === 'buyer') filter.buyerId = req.user._id;
  else if (role === 'seller') filter.sellerId = req.user._id;
  else filter.$or = [{ buyerId: req.user._id }, { sellerId: req.user._id }];
  if (status) filter.status = status;

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('productId', 'title price status images')
      .populate('buyerId', 'fullName avatarUrl commune quartier')
      .populate('sellerId', 'fullName avatarUrl commune quartier isVerifiedSeller')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Order.countDocuments(filter)
  ]);

  return successResponse(res, { message: 'Mes commandes.', data: orders, meta: { page, limit, total, pages: Math.ceil(total / limit) } });
});

export const getOrder = asyncHandler(async (req, res) => {
  const order = await req.order.populate([
    { path: 'productId', select: 'title price status moderationStatus images' },
    { path: 'buyerId', select: 'fullName avatarUrl commune quartier' },
    { path: 'sellerId', select: 'fullName avatarUrl commune quartier isVerifiedSeller' },
    { path: 'conversationId', select: 'lastMessageText lastMessageAt status' }
  ]);
  return successResponse(res, { message: 'Détail commande.', data: order });
});

export const reserveOrder = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  let updatedOrder;

  await session.withTransaction(async () => {
    const order = await Order.findById(req.order._id).session(session);
    if (!isSeller(order, req.user)) throw new ApiError(403, 'Seul le vendeur peut réserver ce produit.', 'ONLY_SELLER_CAN_RESERVE');
    if (order.status !== 'PENDING') throw new ApiError(400, 'Cette commande ne peut pas être réservée.', 'ORDER_NOT_PENDING');

    const product = await Product.findOne({ _id: order.productId, status: 'AVAILABLE', archivedAt: null, deletedAt: null }).session(session);
    if (!product) throw new ApiError(400, 'Produit déjà indisponible.', 'PRODUCT_NOT_AVAILABLE');

    product.status = 'RESERVED';
    product.reservedAt = new Date();
    await product.save({ session });

    order.status = 'RESERVED';
    updatedOrder = await order.save({ session });
  });

  await session.endSession();
  return successResponse(res, { message: 'Produit réservé pour cette commande.', data: updatedOrder });
});

export const completeOrder = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  let updatedOrder;

  await session.withTransaction(async () => {
    const order = await Order.findById(req.order._id).session(session);
    if (!isBuyer(order, req.user) && !isSeller(order, req.user)) {
      throw new ApiError(403, 'Vous ne pouvez pas confirmer cette commande.', 'ORDER_CONFIRM_FORBIDDEN');
    }
    if (!['RESERVED', 'SELLER_CONFIRMED', 'BUYER_CONFIRMED'].includes(order.status)) {
      throw new ApiError(400, 'Cette commande ne peut pas être finalisée.', 'ORDER_NOT_COMPLETABLE');
    }

    if (isBuyer(order, req.user)) order.buyerConfirmedAt = new Date();
    if (isSeller(order, req.user)) order.sellerConfirmedAt = new Date();

    if (order.buyerConfirmedAt && order.sellerConfirmedAt) {
      order.status = 'COMPLETED';
      order.completedAt = new Date();
      order.reviewStatus = 'AVAILABLE';
      await Product.updateOne(
        { _id: order.productId },
        { $set: { status: 'SOLD', soldAt: new Date(), isBoosted: false, activeBoostId: null } },
        { session }
      );
    } else if (order.sellerConfirmedAt) order.status = 'SELLER_CONFIRMED';
    else if (order.buyerConfirmedAt) order.status = 'BUYER_CONFIRMED';

    updatedOrder = await order.save({ session });
  });

  await session.endSession();
  if (updatedOrder?.status === 'COMPLETED') {
    await createNotification({
      userId: updatedOrder.buyerId,
      type: 'PRODUCT_SOLD',
      title: 'Vente confirmée',
      body: 'La vente est confirmée. Vous pouvez maintenant laisser un avis.',
      data: { orderId: updatedOrder._id, productId: updatedOrder.productId }
    });
    await createNotification({
      userId: updatedOrder.sellerId,
      type: 'PRODUCT_SOLD',
      title: 'Produit vendu',
      body: 'La vente est confirmée. Vous pouvez maintenant recevoir un avis.',
      data: { orderId: updatedOrder._id, productId: updatedOrder.productId }
    });
  }

  return successResponse(res, { message: 'Confirmation enregistrée.', data: updatedOrder });
});

export const cancelOrder = asyncHandler(async (req, res) => {
  const order = req.order;
  if (!isBuyer(order, req.user) && !isSeller(order, req.user)) {
    throw new ApiError(403, 'Vous ne pouvez pas annuler cette commande.', 'ORDER_CANCEL_FORBIDDEN');
  }
  if (['COMPLETED', 'CANCELLED'].includes(order.status)) {
    throw new ApiError(400, 'Cette commande ne peut plus être annulée.', 'ORDER_NOT_CANCELLABLE');
  }

  const wasReserved = order.status === 'RESERVED';
  order.status = 'CANCELLED';
  order.cancelledAt = new Date();
  order.cancelReason = req.validated.body.reason;
  await order.save();

  if (wasReserved) {
    await Product.updateOne({ _id: order.productId, status: 'RESERVED' }, { $set: { status: 'AVAILABLE', reservedAt: null } });
  }

  return successResponse(res, { message: 'Commande annulée.', data: order });
});

export const disputeOrder = asyncHandler(async (req, res) => {
  const order = req.order;
  if (!isBuyer(order, req.user) && !isSeller(order, req.user)) {
    throw new ApiError(403, 'Vous ne pouvez pas ouvrir un litige sur cette commande.', 'ORDER_DISPUTE_FORBIDDEN');
  }
  if (['COMPLETED', 'CANCELLED'].includes(order.status)) {
    throw new ApiError(400, 'Litige impossible sur cette commande.', 'ORDER_DISPUTE_NOT_ALLOWED');
  }

  order.status = 'DISPUTED';
  order.disputedAt = new Date();
  order.disputeReason = req.validated.body.reason;
  await order.save();

  if (order.conversationId) await Conversation.updateOne({ _id: order.conversationId }, { $set: { status: 'DISPUTED', isReported: true } });

  return successResponse(res, { message: 'Litige ouvert.', data: order });
});
