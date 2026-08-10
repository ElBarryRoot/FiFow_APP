import { API_BASE_URL } from './config.js'
import { ApiError } from './errors.js'
import { apiRequest, buildSearchParams, getAccessToken, refreshAccessToken } from './http.js'

function page(response) {
  return {
    items: response.data || [],
    nextCursor: response.meta?.nextCursor || null,
  }
}

function list(path, filters = {}) {
  return apiRequest(`${path}${buildSearchParams(filters)}`, { auth: 'required' }).then(page)
}

function data(path, options = {}) {
  return apiRequest(path, { auth: 'required', ...options }).then((response) => response.data)
}

async function privateFile(path, retry = true) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      Accept: 'image/*,application/pdf',
      Authorization: `Bearer ${getAccessToken() || ''}`,
    },
    credentials: 'include',
  })

  if (response.status === 401 && retry) {
    await refreshAccessToken()
    return privateFile(path, false)
  }

  if (!response.ok) {
    let payload = null
    try {
      payload = await response.json()
    } catch {
      payload = null
    }
    throw new ApiError({
      status: response.status,
      code: payload?.errorCode || `HTTP_${response.status}`,
      message: payload?.message || 'Le document privé ne peut pas être chargé.',
    })
  }

  return response.blob()
}

export const adminApi = {
  dashboard: () => data('/admin/dashboard'),

  users: {
    list: (filters) => list('/admin/users', filters),
    detail: (id) => data(`/admin/users/${id}`),
  },

  products: {
    list: (filters) => list('/admin/products', filters),
    detail: (id) => data(`/admin/products/${id}`),
  },

  orders: {
    list: (filters) => list('/admin/orders', filters),
    detail: (id) => data(`/admin/orders/${id}`),
  },

  reports: {
    list: (filters) => list('/admin/reports', filters),
    detail: (id) => data(`/admin/reports/${id}`),
    assign: (id) => data(`/admin/reports/${id}/assign`, { method: 'PATCH' }),
    resolve: (id, input) => data(`/admin/reports/${id}/resolve`, { method: 'PATCH', body: input }),
  },

  moderation: {
    apply: (input) => data('/admin/moderation/actions', { method: 'POST', body: input }),
  },

  verifications: {
    list: (filters) => list('/admin/seller-verifications', filters),
    approve: (id, reason) => data(`/admin/seller-verifications/${id}/approve`, {
      method: 'PATCH',
      body: reason ? { reason } : {},
    }),
    reject: (id, reason) => data(`/admin/seller-verifications/${id}/reject`, {
      method: 'PATCH',
      body: { reason },
    }),
    document: (id, documentIndex) => privateFile(`/admin/seller-verifications/${id}/documents/${documentIndex}`),
  },

  categories: {
    list: (filters) => list('/admin/categories', filters),
    create: (input) => data('/admin/categories', { method: 'POST', body: input }),
    update: (id, input) => data(`/admin/categories/${id}`, { method: 'PATCH', body: input }),
    archive: (id) => data(`/admin/categories/${id}/archive`, { method: 'PATCH' }),
  },

  settings: {
    list: () => data('/admin/settings'),
    update: (key, value) => data(`/admin/settings/${encodeURIComponent(key)}`, {
      method: 'PATCH',
      body: { value },
    }),
  },

  payments: {
    list: (filters) => list('/admin/payments', filters),
    detail: (id) => data(`/admin/payments/${id}`),
    refund: (id, input) => data(`/admin/payments/${id}/refunds`, { method: 'POST', body: input }),
    confirmSandboxRefund: (id, input) => data(`/admin/payments/${id}/refunds/sandbox-confirm`, { method: 'POST', body: input }),
  },

  payouts: {
    list: (filters) => list('/admin/payouts', filters),
    detail: (id) => data(`/admin/payouts/${id}`),
    process: (id) => data(`/admin/payouts/${id}/process`, { method: 'POST' }),
    confirmSandbox: (id, input) => data(`/admin/payouts/${id}/sandbox-confirm`, { method: 'POST', body: input }),
  },

  reviews: {
    list: (filters) => list('/admin/reviews', filters),
    detail: (id) => data(`/admin/reviews/${id}`),
  },

  conversations: {
    listReported: (filters) => list('/admin/conversations/reported', filters),
    detail: (id) => data(`/admin/conversations/${id}`),
  },

  boosts: {
    list: (filters) => list('/admin/boosts', filters),
    detail: (id) => data(`/admin/boosts/${id}`),
    cancel: (id, reason) => data(`/admin/boosts/${id}/cancel`, {
      method: 'PATCH',
      body: { reason },
    }),
  },

  boostPlans: {
    list: (filters) => list('/admin/boost-plans', filters),
    create: (input) => data('/admin/boost-plans', { method: 'POST', body: input }),
    update: (id, input) => data(`/admin/boost-plans/${id}`, { method: 'PATCH', body: input }),
    archive: (id) => data(`/admin/boost-plans/${id}/archive`, { method: 'PATCH' }),
  },

  support: {
    list: (filters) => list('/admin/support', filters),
    detail: (id) => data(`/admin/support/${id}`),
    assign: (id) => data(`/admin/support/${id}/assign`, { method: 'PATCH' }),
    updateStatus: (id, status) => data(`/admin/support/${id}/status`, {
      method: 'PATCH',
      body: { status },
    }),
    message: (id, message) => data(`/admin/support/${id}/messages`, {
      method: 'POST',
      body: { message },
    }),
  },

  logs: {
    list: (filters) => list('/admin/logs', filters),
  },
}
