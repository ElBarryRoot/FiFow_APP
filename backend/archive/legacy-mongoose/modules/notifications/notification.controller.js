import { successResponse } from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/apiError.js';
import { Notification } from './notification.model.js';

export const listNotifications = asyncHandler(async (req, res) => {
  const { page, limit, isRead } = req.validated.query;
  const skip = (page - 1) * limit;
  const filter = { userId: req.user._id, archivedAt: null };
  if (isRead === 'true') filter.isRead = true;
  if (isRead === 'false') filter.isRead = false;

  const [notifications, total] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments(filter)
  ]);

  return successResponse(res, {
    message: 'Notifications utilisateur.',
    data: notifications,
    meta: { page, limit, total, pages: Math.ceil(total / limit) }
  });
});

export const markNotificationRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOne({ _id: req.params.id, userId: req.user._id, archivedAt: null });
  if (!notification) throw new ApiError(404, 'Notification introuvable.', 'NOTIFICATION_NOT_FOUND');

  notification.isRead = true;
  notification.readAt = notification.readAt || new Date();
  await notification.save();

  return successResponse(res, { message: 'Notification marquée comme lue.', data: notification });
});

export const markAllNotificationsRead = asyncHandler(async (req, res) => {
  const result = await Notification.updateMany(
    { userId: req.user._id, isRead: false, archivedAt: null },
    { $set: { isRead: true, readAt: new Date() } }
  );

  return successResponse(res, { message: 'Toutes les notifications ont été marquées comme lues.', data: { modifiedCount: result.modifiedCount } });
});
