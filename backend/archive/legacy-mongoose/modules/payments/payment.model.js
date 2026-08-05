import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['BOOST', 'ORDER_PAYMENT', 'DELIVERY_FEE', 'SUBSCRIPTION'], required: true, index: true },
    amount: { type: Number, required: true, min: 1 },
    currency: { type: String, enum: ['GNF'], default: 'GNF' },
    provider: { type: String, enum: ['ORANGE_MONEY', 'MOMO', 'OTHER', 'MOCK'], required: true, index: true },
    providerTransactionId: { type: String, trim: true, default: null, index: true },
    internalReference: { type: String, required: true, unique: true, index: true },
    status: {
      type: String,
      enum: ['PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'CANCELLED', 'REFUNDED'],
      default: 'PENDING',
      index: true
    },
    phone: { type: String, trim: true, required: true },
    relatedModel: { type: String, enum: ['Boost', 'Order', 'Delivery', null], default: null, index: true },
    relatedId: { type: mongoose.Schema.Types.ObjectId, default: null, index: true },
    callbackPayload: { type: mongoose.Schema.Types.Mixed, default: null, select: false },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    paidAt: { type: Date, default: null },
    failedAt: { type: Date, default: null },
    failureReason: { type: String, trim: true, maxlength: 800, default: null },
    archivedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

paymentSchema.index({ relatedModel: 1, relatedId: 1, status: 1 });
paymentSchema.index({ userId: 1, createdAt: -1 });
paymentSchema.index({ status: 1, createdAt: -1 });

export const Payment = mongoose.model('Payment', paymentSchema);
