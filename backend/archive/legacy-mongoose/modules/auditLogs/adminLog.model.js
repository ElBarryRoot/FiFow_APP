import mongoose from 'mongoose';

const adminLogSchema = new mongoose.Schema(
  {
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    action: {
      type: String,
      enum: [
        'USER_UPDATED',
        'USER_ARCHIVED',
        'USER_REPORTED',
        'USER_BLOCKED',
        'USER_UNBLOCKED',
        'SELLER_VERIFICATION_REQUESTED',
        'SELLER_VERIFICATION_APPROVED',
        'SELLER_VERIFICATION_REJECTED',
        'SELLER_VERIFIED_BADGE_REMOVED',
        'CATEGORY_CREATED',
        'CATEGORY_UPDATED',
        'CATEGORY_ARCHIVED',
        'REPORT_ASSIGNED',
        'REPORT_RESOLVED',
        'REVIEW_HIDDEN',
        'MODERATION_ACTION_CREATED',
        'ORDER_UPDATED',
        'CONVERSATION_REPORTED',
        'SETTING_UPDATED',
        'PAYMENT_VALIDATED',
        'PAYMENT_FAILED',
        'BOOST_CANCELLED',
        'BOOST_PLAN_CREATED',
        'BOOST_PLAN_UPDATED',
        'BOOST_PLAN_ARCHIVED'
      ],
      required: true,
      index: true
    },
    targetType: { type: String, required: true, index: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    before: { type: mongoose.Schema.Types.Mixed, default: null },
    after: { type: mongoose.Schema.Types.Mixed, default: null },
    note: { type: String, trim: true, maxlength: 1000, default: null },
    ipAddress: { type: String, default: null },
    userAgent: { type: String, default: null }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

adminLogSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });

export const AdminLog = mongoose.model('AdminLog', adminLogSchema);
