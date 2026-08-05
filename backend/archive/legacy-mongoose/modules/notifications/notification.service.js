import { Notification } from './notification.model.js';

export async function createNotification({ userId, type, title, body, data = {} }) {
  if (!userId || !type || !title || !body) return null;
  return Notification.create({ userId, type, title, body, data });
}

export async function createManyNotifications(notifications = []) {
  const cleanNotifications = notifications.filter((item) => item?.userId && item?.type && item?.title && item?.body);
  if (!cleanNotifications.length) return [];
  return Notification.insertMany(cleanNotifications, { ordered: false });
}
