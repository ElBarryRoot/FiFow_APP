import mongoose from 'mongoose';

const sellerVerificationRequestSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    fullName: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    phone: { type: String, required: true, trim: true },
    avatarUrl: { type: String, required: true },
    commune: { type: String, required: true, trim: true, maxlength: 80 },
    quartier: { type: String, required: true, trim: true, maxlength: 80 },
    note: { type: String, trim: true, maxlength: 1000, default: null },
    status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'], default: 'PENDING', index: true },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt: { type: Date, default: null },
    rejectionReason: { type: String, trim: true, maxlength: 1000, default: null },
    archivedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

sellerVerificationRequestSchema.index({ userId: 1, status: 1 });
sellerVerificationRequestSchema.index({ createdAt: -1 });

export const SellerVerificationRequest = mongoose.model('SellerVerificationRequest', sellerVerificationRequestSchema);
