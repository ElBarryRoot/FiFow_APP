import mongoose from 'mongoose';

const boostSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    boostPlanId: { type: mongoose.Schema.Types.ObjectId, ref: 'BoostPlan', required: true, index: true },
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', default: null, index: true },
    status: {
      type: String,
      enum: ['PENDING_PAYMENT', 'ACTIVE', 'EXPIRED', 'CANCELLED', 'REJECTED'],
      default: 'PENDING_PAYMENT',
      index: true
    },
    startsAt: { type: Date, default: null, index: true },
    endsAt: { type: Date, default: null, index: true },
    impressions: { type: Number, default: 0, min: 0 },
    clicks: { type: Number, default: 0, min: 0 },
    cancelReason: { type: String, trim: true, maxlength: 600, default: null },
    archivedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

boostSchema.index({ productId: 1, status: 1 });
boostSchema.index({ sellerId: 1, createdAt: -1 });
boostSchema.index({ status: 1, endsAt: 1 });

export const Boost = mongoose.model('Boost', boostSchema);
