import { createIdempotencyKey, toPaymentView } from './commerceAdapters.js'
import { apiRequest, buildSearchParams } from './http.js'

function adaptPaymentResult(data) {
  if (!data) return null
  if (data.payment) return { ...data, payment: toPaymentView(data.payment) }
  return toPaymentView(data)
}

export const paymentsApi = {
  async initiate(input, { idempotencyKey } = {}) {
    const { idempotencyKey: inputKey, ...body } = input
    const response = await apiRequest('/payments/initiate', {
      method: 'POST',
      body,
      headers: { 'Idempotency-Key': idempotencyKey || inputKey || createIdempotencyKey('payment') },
      auth: 'required',
    })
    return adaptPaymentResult(response.data)
  },

  async list({ cursor, limit = 20 } = {}) {
    const response = await apiRequest(`/payments${buildSearchParams({ cursor, limit })}`, { auth: 'required' })
    return {
      items: response.data.map(toPaymentView),
      nextCursor: response.meta?.nextCursor || null,
    }
  },

  async detail(paymentId) {
    const response = await apiRequest(`/payments/${encodeURIComponent(paymentId)}`, { auth: 'required' })
    return toPaymentView(response.data)
  },

  async mockConfirm(paymentId, input = {}) {
    const response = await apiRequest(`/payments/${encodeURIComponent(paymentId)}/mock-confirm`, {
      method: 'POST', body: input, auth: 'required',
    })
    return adaptPaymentResult(response.data)
  },
}
