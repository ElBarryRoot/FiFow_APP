import mongoose from 'mongoose';

const moderationActionSchema = new mongoose.Schema(
  {
    moderatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    targetType: { type: String, enum: ['PRODUCT', 'USER', 'MESSAGE', 'REVIEW', 'PAYMENT', 'CONVERSATION', 'ORDER'], required: true, index: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    action: {
      type: String,
      enum: ['WARNING', 'HIDE_PRODUCT', 'ARCHIVE_PRODUCT', 'SUSPEND_USER', 'BAN_USER', 'REMOVE_VERIFIED_BADGE', 'RESTORE_PRODUCT', 'HIDE_REVIEW', 'RESTORE_REVIEW', 'REJECT_REPORT', 'BLOCK_CONVERSATION'],
      required: true,
      index: true
    },
    reason: { type: String, trim: true, maxlength: 600, required: true },
    note: { type: String, trim: true, maxlength: 1200, default: null },
    durationDays: { type: Number, min: 1, max: 365, default: null }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

moderationActionSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });

export const ModerationAction = mongoose.model('ModerationAction', moderationActionSchema);
