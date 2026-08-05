import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, trim: true, minlength: 2, maxlength: 80, default: null },
    phone: { type: String, required: true, unique: true, index: true, trim: true },
    phoneVerified: { type: Boolean, default: false },
    commune: { type: String, trim: true, default: null },
    quartier: { type: String, trim: true, default: null },
    avatarUrl: { type: String, default: null },
    role: { type: String, enum: ['USER', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN'], default: 'USER', index: true },
    status: { type: String, enum: ['ACTIVE', 'SUSPENDED', 'BANNED', 'DELETED'], default: 'ACTIVE', index: true },
    isVerifiedSeller: { type: Boolean, default: false, index: true },
    sellerVerificationStatus: {
      type: String,
      enum: ['NOT_REQUESTED', 'PENDING', 'APPROVED', 'REJECTED', 'REMOVED'],
      default: 'NOT_REQUESTED',
      index: true
    },
    sellerVerificationRequestedAt: { type: Date, default: null },
    sellerVerifiedAt: { type: Date, default: null },
    sellerVerificationRejectedReason: { type: String, default: null },
    trustScore: { type: Number, default: 0, min: 0 },
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0, min: 0 },
    totalProducts: { type: Number, default: 0, min: 0 },
    totalSales: { type: Number, default: 0, min: 0 },
    reportCount: { type: Number, default: 0, min: 0 },
    isUnderWatch: { type: Boolean, default: false },
    blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    lastLoginAt: { type: Date, default: null },
    lastActiveAt: { type: Date, default: null },
    refreshTokenHash: { type: String, select: false, default: null },
    deletedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

userSchema.index({ createdAt: -1 });
userSchema.index({ status: 1, isVerifiedSeller: 1 });

export const User = mongoose.model('User', userSchema);
