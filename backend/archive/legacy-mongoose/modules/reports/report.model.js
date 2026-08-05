import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema(
  {
    reporterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    targetType: {
      type: String,
      enum: ['PRODUCT', 'USER', 'MESSAGE', 'REVIEW', 'PAYMENT', 'CONVERSATION'],
      required: true,
      index: true
    },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    reason: {
      type: String,
      enum: [
        'SCAM',
        'FAKE_PRODUCT',
        'FORBIDDEN_PRODUCT',
        'BAD_BEHAVIOR',
        'OFFENSIVE_CONTENT',
        'MISLEADING_PRICE',
        'STOLEN_IMAGE',
        'UNREACHABLE_SELLER',
        'OTHER'
      ],
      required: true,
      index: true
    },
    description: { type: String, trim: true, maxlength: 1200, default: null },
    status: { type: String, enum: ['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED'], default: 'OPEN', index: true },
    priority: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], default: 'MEDIUM', index: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    adminDecision: { type: String, trim: true, maxlength: 1000, default: null },
    adminNote: { type: String, trim: true, maxlength: 1000, default: null },
    resolvedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

reportSchema.index({ targetType: 1, targetId: 1, status: 1 });
reportSchema.index({ reporterId: 1, targetType: 1, targetId: 1 });

export const Report = mongoose.model('Report', reportSchema);
