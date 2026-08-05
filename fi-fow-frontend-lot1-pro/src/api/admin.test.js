import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('./http.js', () => ({
  apiRequest: vi.fn(),
  buildSearchParams: vi.fn((values = {}) => {
    const params = new URLSearchParams()
    Object.entries(values).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') params.set(key, String(value))
    })
    const query = params.toString()
    return query ? `?${query}` : ''
  }),
  getAccessToken: vi.fn(() => 'admin-access-token'),
  refreshAccessToken: vi.fn(),
}))

import { adminApi } from './admin.js'
import { apiRequest } from './http.js'

describe('contrats API administration', () => {
  beforeEach(() => apiRequest.mockReset())

  it('normalise les listes paginées et transmet les filtres', async () => {
    apiRequest.mockResolvedValue({ data: [{ id: 'user-1' }], meta: { nextCursor: 'user-2' } })

    await expect(adminApi.users.list({ search: 'Aissatou', status: 'ACTIVE', limit: 30 })).resolves.toEqual({
      items: [{ id: 'user-1' }],
      nextCursor: 'user-2',
    })
    expect(apiRequest).toHaveBeenCalledWith('/admin/users?search=Aissatou&status=ACTIVE&limit=30', { auth: 'required' })
  })

  it('envoie une décision de signalement avec le contrat exact', async () => {
    apiRequest.mockResolvedValue({ data: { id: 'report-1', status: 'RESOLVED' } })
    const input = { status: 'RESOLVED', decision: 'Annonce retirée après vérification.' }

    await adminApi.reports.resolve('report-1', input)

    expect(apiRequest).toHaveBeenCalledWith('/admin/reports/report-1/resolve', {
      auth: 'required', method: 'PATCH', body: input,
    })
  })

  it('préserve les montants de remboursement sous forme de chaîne', async () => {
    apiRequest.mockResolvedValue({ data: { id: 'refund-1' } })
    const input = { amount: '125000', reason: 'Article non conforme à la commande.' }

    await adminApi.payments.refund('payment-1', input)

    expect(apiRequest).toHaveBeenCalledWith('/admin/payments/payment-1/refunds', {
      auth: 'required', method: 'POST', body: input,
    })
  })

  it('utilise les routes support et formules de boost attendues', async () => {
    apiRequest
      .mockResolvedValueOnce({ data: { id: 'ticket-1', status: 'WAITING_FOR_USER' } })
      .mockResolvedValueOnce({ data: [{ id: 'plan-1' }], meta: { nextCursor: null } })

    await adminApi.support.updateStatus('ticket-1', 'WAITING_FOR_USER')
    await adminApi.boostPlans.list({ status: 'active', limit: 20 })

    expect(apiRequest.mock.calls[0]).toEqual(['/admin/support/ticket-1/status', {
      auth: 'required', method: 'PATCH', body: { status: 'WAITING_FOR_USER' },
    }])
    expect(apiRequest.mock.calls[1]).toEqual(['/admin/boost-plans?status=active&limit=20', { auth: 'required' }])
  })
})
