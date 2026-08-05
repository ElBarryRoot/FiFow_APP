import mongoose from 'mongoose';
import { successResponse } from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/apiError.js';
import { User } from '../users/user.model.js';
import { Product } from '../products/product.model.js';
import { Conversation } from '../conversations/conversation.model.js';
import { Message } from '../conversations/message.model.js';
import { Order } from '../orders/order.model.js';
import { Report } from '../reports/report.model.js';
import { AdminLog } from '../auditLogs/adminLog.model.js';
import { Review } from './review.model.js';

function isOrderParticipant(order, userId) {
  return order.buyerId.toString() === userId.toString() || order.sellerId.toString() === userId.toString();
}

function getReviewedUserFromOrder(order, reviewerId) {
  if (order.buyerId.toString() === reviewerId.toString()) return order.sellerId;
  if (order.sellerId.toString() === reviewerId.toString()) return order.buyerId;
  return null;
}

async function recalculateUserRating(userId, session = null) {
  const pipeline = [
    { $match: { reviewedUserId: new mongoose.Types.ObjectId(userId), status: 'PUBLISHED' } },
    { $group: { _id: '$reviewedUserId', averageRating: { $avg: '$rating' }, totalReviews: { $sum: 1 } } }
  ];
  const [stats] = await Review.aggregate(pipeline).session(session);
  await User.updateOne(
    { _id: userId },
    {
      $set: {
        averageRating: stats ? Number(stats.averageRating.toFixed(2)) : 0,
        totalReviews: stats ? stats.totalReviews : 0
      }
    },
    { session }
  );
}

async function buildReviewFromOrder(payload, reviewerId) {
  const order = await Order.findById(payload.orderId);
  if (!order) throw new ApiError(404, 'Commande introuvable.', 'ORDER_NOT_FOUND');
  if (!isOrderParticipant(order, reviewerId)) throw new ApiError(403, 'Vous ne pouvez pas noter cette commande.', 'REVIEW_ORDER_FORBIDDEN');
  if (order.status !== 'COMPLETED' || !['AVAILABLE', 'BUYER_REVIEWED', 'SELLER_REVIEWED'].includes(order.reviewStatus)) {
    throw new ApiError(400, 'Avis non disponible pour cette commande.', 'REVIEW_NOT_AVAILABLE');
  }

  const reviewedUserId = getReviewedUserFromOrder(order, reviewerId);
  if (!reviewedUserId) throw new ApiError(403, 'Participant invalide pour cette commande.', 'INVALID_ORDER_PARTICIPANT');

  return {
    order,
    reviewData: {
      reviewerId,
      reviewedUserId,
      productId: order.productId,
      orderId: order._id,
      conversationId: order.conversationId || null
    }
  };
}

async function buildReviewFromConversation(payload, reviewerId) {
  const conversation = await Conversation.findById(payload.conversationId);
  if (!conversation) throw new ApiError(404, 'Conversation introuvable.', 'CONVERSATION_NOT_FOUND');
  if (!conversation.participants.some((id) => id.toString() === reviewerId.toString())) {
    throw new ApiError(403, 'Vous ne pouvez pas noter cette conversation.', 'REVIEW_CONVERSATION_FORBIDDEN');
  }
  if (conversation.status === 'BLOCKED') throw new ApiError(400, 'Avis impossible sur une conversation bloquée.', 'CONVERSATION_BLOCKED');
  if (conversation.productId.toString() !== payload.productId) {
    throw new ApiError(400, 'Produit invalide pour cette conversation.', 'INVALID_REVIEW_PRODUCT');
  }

  const reviewedUserId = payload.reviewedUserId;
  const isValidReviewedUser = conversation.participants.some((id) => id.toString() === reviewedUserId.toString()) && reviewedUserId.toString() !== reviewerId.toString();
  if (!isValidReviewedUser) throw new ApiError(400, 'Utilisateur évalué invalide.', 'INVALID_REVIEWED_USER');

  const messagesCount = await Message.countDocuments({ conversationId: conversation._id, isDeleted: false });
  if (messagesCount < 2) {
    throw new ApiError(400, 'Un avis nécessite une interaction réelle.', 'INSUFFICIENT_INTERACTION_FOR_REVIEW');
  }

  const product = await Product.findById(payload.productId).select('_id sellerId');
  if (!product) throw new ApiError(404, 'Produit introuvable.', 'PRODUCT_NOT_FOUND');

  return {
    order: null,
    reviewData: {
      reviewerId,
      reviewedUserId,
      productId: product._id,
      orderId: null,
      conversationId: conversation._id
    }
  };
}

function nextReviewStatus(order, reviewerId) {
  const reviewerIsBuyer = order.buyerId.toString() === reviewerId.toString();
  if (order.reviewStatus === 'AVAILABLE') return reviewerIsBuyer ? 'BUYER_REVIEWED' : 'SELLER_REVIEWED';
  if (order.reviewStatus === 'BUYER_REVIEWED' && !reviewerIsBuyer) return 'COMPLETED';
  if (order.reviewStatus === 'SELLER_REVIEWED' && reviewerIsBuyer) return 'COMPLETED';
  return order.reviewStatus;
}

export const createReview = asyncHandler(async (req, res) => {
  const payload = req.validated.body;
  const reviewerId = req.user._id;
  const source = payload.orderId
    ? await buildReviewFromOrder(payload, reviewerId)
    : await buildReviewFromConversation(payload, reviewerId);

  if (source.reviewData.reviewedUserId.toString() === reviewerId.toString()) {
    throw new ApiError(400, 'Vous ne pouvez pas vous noter vous-même.', 'SELF_REVIEW_FORBIDDEN');
  }

  const session = await mongoose.startSession();
  let review;

  try {
    await session.withTransaction(async () => {
      review = await Review.create(
        [
          {
            ...source.reviewData,
            rating: payload.rating,
            communicationRating: payload.communicationRating || null,
            productAccuracyRating: payload.productAccuracyRating || null,
            behaviorRating: payload.behaviorRating || null,
            comment: payload.comment
          }
        ],
        { session }
      );
      review = review[0];

      if (source.order) {
        source.order.reviewStatus = nextReviewStatus(source.order, reviewerId);
        await source.order.save({ session });
      }

      await recalculateUserRating(source.reviewData.reviewedUserId, session);
    });
  } catch (error) {
    if (error?.code === 11000) throw new ApiError(409, 'Vous avez déjà laissé un avis pour cette interaction.', 'REVIEW_ALREADY_EXISTS');
    throw error;
  } finally {
    await session.endSession();
  }

  return successResponse(res, { statusCode: 201, message: 'Avis publié avec succès.', data: review });
});

export const listUserReviews = asyncHandler(async (req, res) => {
  const { id } = req.validated.params;
  const { page, limit, status } = req.validated.query;
  const skip = (page - 1) * limit;
  const isAdmin = req.user && ['MODERATOR', 'ADMIN', 'SUPER_ADMIN'].includes(req.user.role);

  const filter = { reviewedUserId: id, status: status || 'PUBLISHED' };
  if (!isAdmin) filter.status = 'PUBLISHED';

  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .populate('reviewerId', 'fullName avatarUrl commune quartier isVerifiedSeller')
      .populate('productId', 'title price images status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Review.countDocuments(filter)
  ]);

  return successResponse(res, { message: 'Avis utilisateur.', data: reviews, meta: { page, limit, total, pages: Math.ceil(total / limit) } });
});

export const replyToReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.validated.params.id);
  if (!review || review.status === 'DELETED') throw new ApiError(404, 'Avis introuvable.', 'REVIEW_NOT_FOUND');
  if (review.reviewedUserId.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Seul l’utilisateur évalué peut répondre à cet avis.', 'REVIEW_REPLY_FORBIDDEN');
  }
  if (review.status !== 'PUBLISHED') throw new ApiError(400, 'Réponse impossible sur un avis masqué.', 'REVIEW_REPLY_NOT_ALLOWED');

  review.sellerReply = req.validated.body.reply;
  review.sellerReplyAt = new Date();
  await review.save();

  return successResponse(res, { message: 'Réponse ajoutée.', data: review });
});

export const reportReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.validated.params.id);
  if (!review || review.status === 'DELETED') throw new ApiError(404, 'Avis introuvable.', 'REVIEW_NOT_FOUND');
  if (review.reviewerId.toString() === req.user._id.toString()) {
    throw new ApiError(400, 'Vous ne pouvez pas signaler votre propre avis.', 'CANNOT_REPORT_OWN_REVIEW');
  }

  const existing = await Report.findOne({ reporterId: req.user._id, targetType: 'REVIEW', targetId: review._id, status: { $in: ['OPEN', 'UNDER_REVIEW'] } });
  if (existing) throw new ApiError(409, 'Vous avez déjà signalé cet avis.', 'REPORT_ALREADY_EXISTS');

  const report = await Report.create({
    reporterId: req.user._id,
    targetType: 'REVIEW',
    targetId: review._id,
    reason: req.validated.body.reason,
    description: req.validated.body.description || null,
    priority: req.validated.body.reason === 'OFFENSIVE_CONTENT' ? 'HIGH' : 'MEDIUM'
  });

  review.isReported = true;
  review.reportCount += 1;
  if (review.reportCount >= 3 && review.status === 'PUBLISHED') review.status = 'PENDING_MODERATION';
  await review.save();

  return successResponse(res, { statusCode: 201, message: 'Avis signalé.', data: report });
});

export const adminListReviews = asyncHandler(async (req, res) => {
  const { page, limit, status, isReported } = req.validated.query;
  const skip = (page - 1) * limit;
  const filter = {};
  if (status) filter.status = status;
  if (typeof isReported === 'boolean') filter.isReported = isReported;

  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .populate('reviewerId', 'fullName phone status')
      .populate('reviewedUserId', 'fullName phone status averageRating totalReviews')
      .populate('productId', 'title status moderationStatus')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Review.countDocuments(filter)
  ]);

  return successResponse(res, { message: 'Liste des avis.', data: reviews, meta: { page, limit, total, pages: Math.ceil(total / limit) } });
});

export const hideReview = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  let review;

  await session.withTransaction(async () => {
    review = await Review.findById(req.validated.params.id).session(session);
    if (!review || review.status === 'DELETED') throw new ApiError(404, 'Avis introuvable.', 'REVIEW_NOT_FOUND');

    const before = review.toObject();
    review.status = 'HIDDEN';
    review.hiddenAt = new Date();
    review.hiddenBy = req.user._id;
    review.hiddenReason = req.validated.body.reason;
    await review.save({ session });

    await recalculateUserRating(review.reviewedUserId, session);
    await AdminLog.create(
      [
        {
          adminId: req.user._id,
          action: 'REVIEW_HIDDEN',
          targetType: 'REVIEW',
          targetId: review._id,
          before,
          after: review.toObject(),
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'] || null
        }
      ],
      { session }
    );
  });

  await session.endSession();
  return successResponse(res, { message: 'Avis masqué avec succès.', data: review });
});
