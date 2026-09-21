import { apiRequest } from './http.js'

export const usersApi = {
  async updateMe(input) {
    return (await apiRequest('/users/me', { method: 'PATCH', body: input, auth: 'required' })).data
  },
  async updateAvatar(file) {
    const body = new FormData()
    body.append('image', file)
    return (await apiRequest('/users/me/avatar', { method: 'PUT', body, auth: 'required', timeoutMs: 30_000 })).data
  },
  deleteAvatar() {
    return apiRequest('/users/me/avatar', { method: 'DELETE', auth: 'required' })
  },
  archiveMe() {
    return apiRequest('/users/me/archive', { method: 'POST', auth: 'required' })
  },
  async publicProfile(userId) {
    return (await apiRequest(`/users/${encodeURIComponent(userId)}/public`)).data
  },
  block(userId, reason) {
    return apiRequest(`/users/${encodeURIComponent(userId)}/block`, {
      method: 'POST', body: reason ? { reason } : {}, auth: 'required',
    })
  },
  unblock(userId) {
    return apiRequest(`/users/${encodeURIComponent(userId)}/block`, { method: 'DELETE', auth: 'required' })
  },
}

