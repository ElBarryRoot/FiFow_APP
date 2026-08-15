import { toProductView } from './adapters.js'
import { apiRequest, buildSearchParams } from './http.js'

export const catalogueApi = {
  async categories() {
    return (await apiRequest('/categories', { auth: 'none' })).data
  },
  async list(filters = {}) {
    const query = buildSearchParams(filters)
    const response = await apiRequest(`/products${query}`, { auth: 'none' })
    return { items: response.data.map(toProductView), nextCursor: response.meta?.nextCursor || null }
  },
  async detail(slug) {
    return toProductView((await apiRequest(`/products/${encodeURIComponent(slug)}`, { auth: 'none' })).data)
  },
  async similar(productId, limit = 4) {
    const response = await apiRequest(`/products/${encodeURIComponent(productId)}/similar${buildSearchParams({ limit })}`, { auth: 'none' })
    return response.data.map(toProductView)
  },
  async mine() {
    return (await apiRequest('/products/mine', { auth: 'required' })).data.map(toProductView)
  },
  async create(input) {
    return toProductView((await apiRequest('/products', { method: 'POST', body: input, auth: 'required' })).data)
  },
  async update(productId, input) {
    return toProductView((await apiRequest(`/products/${productId}`, { method: 'PATCH', body: input, auth: 'required' })).data)
  },
  async updateStock(productId, stockQuantity) {
    return toProductView((await apiRequest(`/products/${productId}/stock`, {
      method: 'PATCH', body: { stockQuantity }, auth: 'required',
    })).data)
  },
  async addImage(productId, file) {
    const body = new FormData()
    body.append('image', file)
    return (await apiRequest(`/products/${productId}/images`, {
      method: 'POST', body, auth: 'required', timeoutMs: 45_000,
    })).data
  },
  deleteImage(productId, imageId) {
    return apiRequest(`/products/${productId}/images/${imageId}`, { method: 'DELETE', auth: 'required' })
  },
  setMainImage(productId, imageId) {
    return apiRequest(`/products/${productId}/images/${imageId}/main`, { method: 'PATCH', auth: 'required' })
  },
  reorderImages(productId, imageIds) {
    return apiRequest(`/products/${productId}/images/reorder`, {
      method: 'PATCH', body: { imageIds }, auth: 'required',
    })
  },
  async publish(productId) {
    return toProductView((await apiRequest(`/products/${productId}/publish`, { method: 'POST', auth: 'required' })).data)
  },
  archive(productId) {
    return apiRequest(`/products/${productId}/archive`, { method: 'POST', auth: 'required' })
  },
  async favorites() {
    return (await apiRequest('/favorites', { auth: 'required' })).data.map(toProductView)
  },
  async likes() {
    return (await apiRequest('/likes', { auth: 'required' })).data.map(toProductView)
  },
  favorite(productId) {
    return apiRequest(`/products/${productId}/favorite`, { method: 'POST', auth: 'required' })
  },
  unfavorite(productId) {
    return apiRequest(`/products/${productId}/favorite`, { method: 'DELETE', auth: 'required' })
  },
  like(productId) {
    return apiRequest(`/products/${productId}/like`, { method: 'POST', auth: 'required' })
  },
  unlike(productId) {
    return apiRequest(`/products/${productId}/like`, { method: 'DELETE', auth: 'required' })
  },
  view(productId) {
    return apiRequest(`/products/${productId}/view`, { method: 'POST', auth: 'optional' })
  },
}
