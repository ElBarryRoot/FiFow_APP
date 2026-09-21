import { formatRelativeDate } from './adapters.js'
import { apiRequest, buildSearchParams } from './http.js'

function notificationView(notification) {
  return {
    ...notification,
    description: notification.body,
    unread: !notification.readAt,
    time: formatRelativeDate(notification.createdAt),
  }
}

export const notificationsApi = {
  async list({ cursor, limit = 50 } = {}) {
    const response = await apiRequest(`/notifications${buildSearchParams({ cursor, limit })}`, { auth: 'required' })
    return {
      items: response.data.map(notificationView),
      nextCursor: response.meta?.nextCursor || null,
      unreadCount: Number(response.meta?.unreadCount || 0),
    }
  },
  markRead(notificationId) {
    return apiRequest(`/notifications/${notificationId}/read`, { method: 'PATCH', auth: 'required' })
  },
  markAllRead() {
    return apiRequest('/notifications/read-all', { method: 'PATCH', auth: 'required' })
  },
}
