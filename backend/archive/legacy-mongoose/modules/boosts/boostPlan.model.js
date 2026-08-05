import mongoose from 'mongoose';

const boostPlanSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    durationHours: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 1 },
    currency: { type: String, enum: ['GNF'], default: 'GNF' },
    placement: { type: String, enum: ['HOME_FEED', 'SEARCH_RESULTS', 'CATEGORY_PAGE', 'SIMILAR_PRODUCTS'], default: 'HOME_FEED' },
    isActive: { type: Boolean, default: true, index: true },
    archivedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

boostPlanSchema.index({ isActive: 1, price: 1 });

export const BoostPlan = mongoose.model('BoostPlan', boostPlanSchema);
