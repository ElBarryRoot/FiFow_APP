import mongoose from 'mongoose';

const productViewSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    ipAddress: { type: String, default: null },
    userAgent: { type: String, default: null },
    viewedAt: { type: Date, default: Date.now, index: true }
  },
  { timestamps: false }
);

productViewSchema.index({ productId: 1, viewedAt: -1 });
productViewSchema.index({ userId: 1, productId: 1, viewedAt: -1 });

export const ProductView = mongoose.model('ProductView', productViewSchema);
