import { createIdempotencyKey, toBoostPlanView, toBoostView, toPaymentView } from './commerceAdapters.js'
import { apiRequest, buildSearchParams } from './http.js'

export const boostsApi = {
  async plans() {
    const response = await apiRequest('/boosts/plans', { auth: 'none' })
    return response.data.map(toBoostPlanView)
  },

  async create(productId, input, { idempotencyKey } = {}) {
    const { idempotencyKey: inputKey, ...body } = input
    const response = await apiRequest(`/boosts/products/${encodeURIComponent(productId)}`, {
      method: 'POST',
      body,
      headers: { 'Idempotency-Key': idempotencyKey || inputKey || createIdempotencyKey('boost') },
      auth: 'required',
    })
    return {
      ...response.data,
      boost: toBoostView(response.data.boost),
      payment: toPaymentView(response.data.payment),
    }
  },

  async mine({ cursor, limit = 20 } = {}) {
    const response = await apiRequest(`/boosts/mine${buildSearchParams({ cursor, limit })}`, { auth: 'required' })
    return {
      items: response.data.map(toBoostView),
      nextCursor: response.meta?.nextCursor || null,
    }
  },
}
