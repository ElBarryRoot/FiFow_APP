import { createIdempotencyKey, toOrderView, toQuoteView } from './commerceAdapters.js'
import { apiRequest, buildSearchParams } from './http.js'

function idempotencyHeaders(key, scope) {
  return { 'Idempotency-Key': key || createIdempotencyKey(scope) }
}

async function orderAction(orderId, action, body, currentUserId) {
  const response = await apiRequest(`/orders/${encodeURIComponent(orderId)}/${action}`, {
    method: 'PATCH',
    ...(body === undefined ? {} : { body }),
    auth: 'required',
  })
  return toOrderView(response.data, currentUserId)
}

export const ordersApi = {
  async quote(input) {
    const response = await apiRequest('/orders/quotes', {
      method: 'POST', body: input, auth: 'required',
    })
    return toQuoteView(response.data)
  },

  async create(input, { idempotencyKey, userId } = {}) {
    const { idempotencyKey: inputKey, ...body } = input
    const response = await apiRequest('/orders', {
      method: 'POST',
      body,
      headers: idempotencyHeaders(idempotencyKey || inputKey, 'order'),
      auth: 'required',
    })
    return toOrderView(response.data, userId)
  },

  async list({ role = 'all', cursor, limit = 20, userId } = {}) {
    const response = await apiRequest(`/orders${buildSearchParams({ role, cursor, limit })}`, { auth: 'required' })
    return {
      items: response.data.map((order) => toOrderView(order, userId)),
      nextCursor: response.meta?.nextCursor || null,
    }
  },

  async detail(orderId, { userId } = {}) {
    const response = await apiRequest(`/orders/${encodeURIComponent(orderId)}`, { auth: 'required' })
    return toOrderView(response.data, userId)
  },

  sellerConfirm(orderId, { userId } = {}) {
    return orderAction(orderId, 'seller-confirm', undefined, userId)
  },

  cancel(orderId, reason, { userId } = {}) {
    return orderAction(orderId, 'cancel', { reason }, userId)
  },

  prepare(orderId, { userId } = {}) {
    return orderAction(orderId, 'prepare', undefined, userId)
  },

  ready(orderId, handoverDetails, { userId } = {}) {
    return orderAction(orderId, 'ready', handoverDetails ? { handoverDetails } : undefined, userId)
  },

  ship(orderId, handoverDetails, { userId } = {}) {
    return orderAction(orderId, 'ship', handoverDetails ? { handoverDetails } : undefined, userId)
  },

  receive(orderId, handoverDetails, { userId } = {}) {
    return orderAction(orderId, 'receive', handoverDetails ? { handoverDetails } : undefined, userId)
  },

  dispute(orderId, reason, { userId } = {}) {
    return orderAction(orderId, 'dispute', { reason }, userId)
  },
}
