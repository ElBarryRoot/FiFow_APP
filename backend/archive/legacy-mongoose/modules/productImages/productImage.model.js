import mongoose from 'mongoose';

const productImageSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    width: { type: Number, default: null },
    height: { type: Number, default: null },
    size: { type: Number, default: null },
    format: { type: String, required: true, enum: ['jpg', 'jpeg', 'png', 'webp'] },
    isMain: { type: Boolean, default: false, index: true },
    sortOrder: { type: Number, default: 0 },
    moderationStatus: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED', 'HIDDEN'], default: 'PENDING', index: true },
    archivedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

productImageSchema.index({ productId: 1, isMain: 1 });
productImageSchema.index({ productId: 1, sortOrder: 1 });

export const ProductImage = mongoose.model('ProductImage', productImageSchema);
