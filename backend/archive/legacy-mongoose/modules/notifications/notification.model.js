import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: [
        'NEW_MESSAGE',
        'PRODUCT_LIKED',
        'PRODUCT_FAVORITED',
        'PRODUCT_REPORTED',
        'BOOST_ACTIVATED',
        'BOOST_EXPIRED',
        'PAYMENT_SUCCESS',
        'PAYMENT_FAILED',
        'PRODUCT_RESERVED',
        'PRODUCT_SOLD',
        'REVIEW_RECEIVED',
        'ADMIN_NOTICE'
      ],
      required: true,
      index: true
    },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    body: { type: String, required: true, trim: true, maxlength: 600 },
    data: { type: mongoose.Schema.Types.Mixed, default: {} },
    isRead: { type: Boolean, default: false, index: true },
    readAt: { type: Date, default: null },
    archivedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

export const Notification = mongoose.model('Notification', notificationSchema);
