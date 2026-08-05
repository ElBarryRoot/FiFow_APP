import { toSupportTicketView } from './commerceAdapters.js'
import { apiRequest, buildSearchParams } from './http.js'

export const supportApi = {
  async create(input) {
    const response = await apiRequest('/support/tickets', {
      method: 'POST', body: input, auth: 'required',
    })
    return toSupportTicketView(response.data)
  },

  async list({ cursor, limit = 20, status } = {}) {
    const response = await apiRequest(`/support/tickets${buildSearchParams({ cursor, limit, status })}`, { auth: 'required' })
    return {
      items: response.data.map(toSupportTicketView),
      nextCursor: response.meta?.nextCursor || null,
    }
  },

  async detail(ticketId) {
    const response = await apiRequest(`/support/tickets/${encodeURIComponent(ticketId)}`, { auth: 'required' })
    return toSupportTicketView(response.data)
  },

  async sendMessage(ticketId, message) {
    const response = await apiRequest(`/support/tickets/${encodeURIComponent(ticketId)}/messages`, {
      method: 'POST', body: { message }, auth: 'required',
    })
    return toSupportTicketView(response.data)
  },
}
