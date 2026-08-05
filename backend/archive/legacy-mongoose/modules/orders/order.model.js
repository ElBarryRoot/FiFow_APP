import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', default: null, index: true },
    status: {
      type: String,
      enum: ['PENDING', 'RESERVED', 'SELLER_CONFIRMED', 'BUYER_CONFIRMED', 'COMPLETED', 'CANCELLED', 'DISPUTED'],
      default: 'PENDING',
      index: true
    },
    priceAgreed: { type: Number, required: true, min: 1 },
    currency: { type: String, enum: ['GNF'], default: 'GNF' },
    handoverMode: { type: String, enum: ['HAND_TO_HAND', 'EXTERNAL_DELIVERY', 'FUTURE_DELIVERY'], required: true },
    buyerConfirmedAt: { type: Date, default: null },
    sellerConfirmedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
    cancelReason: { type: String, trim: true, maxlength: 600, default: null },
    disputedAt: { type: Date, default: null },
    disputeReason: { type: String, trim: true, maxlength: 1000, default: null },
    reviewStatus: {
      type: String,
      enum: ['NOT_AVAILABLE', 'AVAILABLE', 'BUYER_REVIEWED', 'SELLER_REVIEWED', 'COMPLETED'],
      default: 'NOT_AVAILABLE',
      index: true
    },
    archivedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

orderSchema.index({ buyerId: 1, createdAt: -1 });
orderSchema.index({ sellerId: 1, createdAt: -1 });
orderSchema.index({ productId: 1, status: 1 });

export const Order = mongoose.model('Order', orderSchema);
