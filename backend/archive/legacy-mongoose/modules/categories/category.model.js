import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    description: { type: String, trim: true, maxlength: 500, default: null },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null, index: true },
    iconUrl: { type: String, default: null },
    imageUrl: { type: String, default: null },
    isActive: { type: Boolean, default: true, index: true },
    isSensitive: { type: Boolean, default: false, index: true },
    requiresAdminValidation: { type: Boolean, default: false, index: true },
    sortOrder: { type: Number, default: 0, index: true },
    archivedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

categorySchema.index({ parentId: 1, isActive: 1, sortOrder: 1 });

export const Category = mongoose.model('Category', categorySchema);
