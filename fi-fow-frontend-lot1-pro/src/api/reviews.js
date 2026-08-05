import { toReviewView } from './commerceAdapters.js'
import { apiRequest, buildSearchParams } from './http.js'

export const reviewsApi = {
  async create(input) {
    const response = await apiRequest('/reviews', {
      method: 'POST', body: input, auth: 'required',
    })
    return toReviewView(response.data)
  },

  async reply(reviewId, reply) {
    const response = await apiRequest(`/reviews/${encodeURIComponent(reviewId)}/reply`, {
      method: 'PATCH', body: { reply }, auth: 'required',
    })
    return response.data
  },

  async forUser(userId, { cursor, limit = 10 } = {}) {
    const response = await apiRequest(`/reviews/users/${encodeURIComponent(userId)}${buildSearchParams({ cursor, limit })}`, { auth: 'optional' })
    return { items: response.data.map(toReviewView), nextCursor: response.meta?.nextCursor || null }
  },
}
