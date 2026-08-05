import { toSellerVerificationView } from './commerceAdapters.js'
import { apiRequest } from './http.js'

function documentList(documents) {
  if (!documents) return []
  if (typeof File !== 'undefined' && documents instanceof File) return [documents]
  return Array.from(documents)
}

export const sellerVerificationApi = {
  async request({ documents, note } = {}) {
    const body = new FormData()
    documentList(documents).forEach((document) => body.append('documents', document))
    if (note?.trim()) body.append('note', note.trim())

    const response = await apiRequest('/seller-verification/request', {
      method: 'POST', body, auth: 'required', timeoutMs: 60_000,
    })
    return toSellerVerificationView(response.data)
  },

  async me() {
    const response = await apiRequest('/seller-verification/me', { auth: 'required' })
    return toSellerVerificationView(response.data)
  },
}
