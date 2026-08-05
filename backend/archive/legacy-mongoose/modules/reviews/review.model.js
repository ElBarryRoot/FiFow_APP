import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    reviewerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    reviewedUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null, index: true },
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', default: null, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    communicationRating: { type: Number, min: 1, max: 5, default: null },
    productAccuracyRating: { type: Number, min: 1, max: 5, default: null },
    behaviorRating: { type: Number, min: 1, max: 5, default: null },
    comment: { type: String, trim: true, minlength: 10, maxlength: 1000, required: true },
    status: {
      type: String,
      enum: ['PUBLISHED', 'PENDING_MODERATION', 'HIDDEN', 'DELETED'],
      default: 'PUBLISHED',
      index: true
    },
    sellerReply: { type: String, trim: true, maxlength: 600, default: null },
    sellerReplyAt: { type: Date, default: null },
    hiddenAt: { type: Date, default: null },
    hiddenBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    hiddenReason: { type: String, trim: true, maxlength: 800, default: null },
    isReported: { type: Boolean, default: false, index: true },
    reportCount: { type: Number, default: 0, min: 0 },
    archivedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

reviewSchema.index({ reviewerId: 1, orderId: 1 }, { unique: true, partialFilterExpression: { orderId: { $type: 'objectId' } } });
reviewSchema.index({ reviewerId: 1, conversationId: 1, reviewedUserId: 1 }, { unique: true, partialFilterExpression: { conversationId: { $type: 'objectId' } } });
reviewSchema.index({ reviewedUserId: 1, status: 1, createdAt: -1 });
reviewSchema.index({ productId: 1, status: 1 });

export const Review = mongoose.model('Review', reviewSchema);
