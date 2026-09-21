import { apiRequest } from './http.js'

function toCartView(cart) {
  if (!cart) return null
  return {
    ...cart,
    estimatedSubtotal: String(cart.estimatedSubtotal || '0'),
    groups: (cart.groups || []).map((group) => ({
      ...group,
      estimatedSubtotal: String(group.estimatedSubtotal || '0'),
      items: (group.items || []).map((item) => ({
        ...item,
        unitPriceAtAddition: String(item.unitPriceAtAddition || '0'),
        currentUnitPrice: String(item.currentUnitPrice || '0'),
        lineTotal: String(item.lineTotal || '0'),
      })),
    })),
  }
}

export const cartApi = {
  async get() {
    return toCartView((await apiRequest('/cart', { auth: 'required' })).data)
  },
  async add(productId, quantity = 1) {
    return toCartView((await apiRequest('/cart/items', {
      method: 'POST', body: { productId, quantity }, auth: 'required',
    })).data)
  },
  async update(itemId, quantity) {
    return toCartView((await apiRequest(`/cart/items/${encodeURIComponent(itemId)}`, {
      method: 'PATCH', body: { quantity }, auth: 'required',
    })).data)
  },
  async remove(itemId) {
    return toCartView((await apiRequest(`/cart/items/${encodeURIComponent(itemId)}`, {
      method: 'DELETE', auth: 'required',
    })).data)
  },
  async clear() {
    return toCartView((await apiRequest('/cart', { method: 'DELETE', auth: 'required' })).data)
  },
}
