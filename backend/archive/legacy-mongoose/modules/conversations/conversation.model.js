import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true }],
    status: {
      type: String,
      enum: ['ACTIVE', 'ARCHIVED', 'BLOCKED', 'DISPUTED'],
      default: 'ACTIVE',
      index: true
    },
    lastMessageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Message', default: null },
    lastMessageText: { type: String, trim: true, maxlength: 220, default: null },
    lastMessageAt: { type: Date, default: null, index: true },
    unreadCountBuyer: { type: Number, default: 0, min: 0 },
    unreadCountSeller: { type: Number, default: 0, min: 0 },
    isReported: { type: Boolean, default: false, index: true },
    reportCount: { type: Number, default: 0, min: 0 },
    buyerDeletedAt: { type: Date, default: null },
    sellerDeletedAt: { type: Date, default: null },
    archivedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  },
  { timestamps: true }
);

conversationSchema.index({ productId: 1, buyerId: 1, sellerId: 1 }, { unique: true });
conversationSchema.index({ participants: 1, lastMessageAt: -1 });
conversationSchema.index({ isReported: 1, status: 1, updatedAt: -1 });

export const Conversation = mongoose.model('Conversation', conversationSchema);
