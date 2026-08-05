import mongoose from 'mongoose';

const otpCodeSchema = new mongoose.Schema(
  {
    phone: { type: String, required: true, index: true },
    codeHash: { type: String, required: true, select: false },
    purpose: { type: String, enum: ['LOGIN', 'REGISTER', 'VERIFY_PHONE'], required: true, index: true },
    attempts: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 5 },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
    verifiedAt: { type: Date, default: null },
    ipAddress: { type: String, default: null },
    userAgent: { type: String, default: null }
  },
  { timestamps: true }
);

otpCodeSchema.index({ phone: 1, purpose: 1, createdAt: -1 });

export const OtpCode = mongoose.model('OtpCode', otpCodeSchema);
