import { apiRequest, refreshAccessToken } from './http.js'

export const authApi = {
  async register(input) {
    return (await apiRequest('/auth/register', { method: 'POST', body: input, auth: 'none' })).data
  },
  async login(input) {
    return (await apiRequest('/auth/login', { method: 'POST', body: input, auth: 'none' })).data
  },
  refresh: refreshAccessToken,
  async me() {
    return (await apiRequest('/auth/me', { auth: 'required' })).data
  },
  async logout() {
    return apiRequest('/auth/logout', { method: 'POST', auth: 'none', retryAuth: false })
  },
  async logoutAll() {
    return apiRequest('/auth/logout-all', { method: 'POST', auth: 'required' })
  },
  async changePassword(input) {
    return (await apiRequest('/auth/change-password', { method: 'POST', body: input, auth: 'required' })).data
  },
  async verifyEmail(token) {
    return apiRequest('/auth/verify-email', { method: 'POST', body: { token }, auth: 'none' })
  },
  async resendVerification() {
    return apiRequest('/auth/resend-verification', { method: 'POST', auth: 'required' })
  },
  async forgotPassword(email) {
    return apiRequest('/auth/forgot-password', { method: 'POST', body: { email }, auth: 'none' })
  },
  async resetPassword(input) {
    return apiRequest('/auth/reset-password', { method: 'POST', body: input, auth: 'none' })
  },
}
