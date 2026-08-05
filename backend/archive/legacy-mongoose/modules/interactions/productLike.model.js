import mongoose from 'mongoose';

const productLikeSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

productLikeSchema.index({ userId: 1, productId: 1 }, { unique: true });

export const ProductLike = mongoose.model('ProductLike', productLikeSchema);
