import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, minlength: 5, maxlength: 120 },
    slug: { type: String, required: true, trim: true, lowercase: true, index: true },
    description: { type: String, required: true, trim: true, minlength: 20, maxlength: 2000 },
    price: { type: Number, required: true, min: 1, index: true },
    currency: { type: String, default: 'GNF', enum: ['GNF'], index: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    subCategoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    condition: { type: String, enum: ['NEW', 'USED', 'REFURBISHED'], required: true, index: true },
    isNegotiable: { type: Boolean, required: true },
    commune: { type: String, required: true, trim: true, index: true },
    quartier: { type: String, required: true, trim: true, index: true },
    handoverModes: [{ type: String, enum: ['HAND_TO_HAND', 'EXTERNAL_DELIVERY', 'FUTURE_DELIVERY'] }],
    status: {
      type: String,
      enum: ['DRAFT', 'AVAILABLE', 'RESERVED', 'SOLD', 'ARCHIVED', 'DELETED'],
      default: 'AVAILABLE',
      index: true
    },
    moderationStatus: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'FLAGGED', 'HIDDEN'],
      default: 'PENDING',
      index: true
    },
    images: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ProductImage' }],
    viewsCount: { type: Number, default: 0, min: 0 },
    likesCount: { type: Number, default: 0, min: 0 },
    favoritesCount: { type: Number, default: 0, min: 0 },
    conversationsCount: { type: Number, default: 0, min: 0 },
    reportsCount: { type: Number, default: 0, min: 0 },
    isBoosted: { type: Boolean, default: false, index: true },
    activeBoostId: { type: mongoose.Schema.Types.ObjectId, ref: 'Boost', default: null },
    boostedUntil: { type: Date, default: null, index: true },
    reservedAt: { type: Date, default: null },
    soldAt: { type: Date, default: null },
    archivedAt: { type: Date, default: null },
    deletedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

productSchema.index({ title: 'text', description: 'text' });
productSchema.index({ status: 1, moderationStatus: 1, createdAt: -1 });
productSchema.index({ categoryId: 1, subCategoryId: 1, status: 1 });
productSchema.index({ commune: 1, quartier: 1, status: 1 });

export const Product = mongoose.model('Product', productSchema);
