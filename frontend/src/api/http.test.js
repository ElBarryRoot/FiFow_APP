import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  apiRequest,
  buildSearchParams,
  clearAccessToken,
  getAccessToken,
  onSessionExpired,
  refreshAccessToken,
  setAccessToken,
} from './http.js'

function jsonResponse(payload, status = 200, headers = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  })
}

describe('client HTTP', () => {
  let removeSessionHandler

  beforeEach(() => {
    clearAccessToken()
    removeSessionHandler = onSessionExpired(null)
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    removeSessionHandler?.()
    clearAccessToken()
    vi.unstubAllGlobals()
  })

  it('envoie le JSON, le cookie de session et le jeton en memoire', async () => {
    setAccessToken('access-token')
    fetch.mockResolvedValue(jsonResponse({ success: true, data: { id: 'product-1' } }, 201))

    const result = await apiRequest('/products', {
      method: 'POST',
      auth: 'required',
      body: { title: 'Telephone' },
    })

    expect(result.data).toEqual({ id: 'product-1' })
    expect(fetch).toHaveBeenCalledTimes(1)
    const [url, options] = fetch.mock.calls[0]
    expect(url).toBe('http://localhost:5000/api/v1/products')
    expect(options.method).toBe('POST')
    expect(options.credentials).toBe('include')
    expect(options.body).toBe(JSON.stringify({ title: 'Telephone' }))
    expect(options.headers.get('Accept')).toBe('application/json')
    expect(options.headers.get('Content-Type')).toBe('application/json')
    expect(options.headers.get('Authorization')).toBe('Bearer access-token')
    expect(options.headers.get('X-Request-Id')).toMatch(/^req_|[0-9a-f-]{20,}/)
  })

  it('normalise les erreurs metier du backend', async () => {
    fetch.mockResolvedValue(jsonResponse({
      success: false,
      message: 'Le formulaire contient des erreurs.',
      errorCode: 'VALIDATION_ERROR',
      requestId: 'req-validation',
      details: [{ field: 'body.email', message: 'Email invalide' }],
    }, 422))

    await expect(apiRequest('/auth/register', {
      method: 'POST',
      auth: 'none',
      body: { email: 'incorrect' },
    })).rejects.toMatchObject({
      name: 'ApiError',
      status: 422,
      code: 'VALIDATION_ERROR',
      requestId: 'req-validation',
      details: [{ field: 'body.email', message: 'Email invalide' }],
    })
  })

  it('ne lance qu un seul refresh pour plusieurs requetes 401 concurrentes', async () => {
    setAccessToken('expired-token')
    let resolveRefresh
    let refreshCalls = 0
    let protectedCalls = 0
    const pendingRefresh = new Promise((resolve) => {
      resolveRefresh = resolve
    })

    fetch.mockImplementation((url, options) => {
      if (url.endsWith('/auth/refresh')) {
        refreshCalls += 1
        expect(options.headers.has('Authorization')).toBe(false)
        return pendingRefresh
      }

      protectedCalls += 1
      if (options.headers.get('Authorization') === 'Bearer expired-token') {
        return Promise.resolve(jsonResponse({
          success: false,
          message: 'Jeton expire.',
          errorCode: 'INVALID_ACCESS_TOKEN',
        }, 401))
      }
      return Promise.resolve(jsonResponse({ success: true, data: { url } }))
    })

    const firstRequest = apiRequest('/users/me', { auth: 'required' })
    const secondRequest = apiRequest('/notifications', { auth: 'required' })

    await vi.waitFor(() => {
      expect(refreshCalls).toBe(1)
      expect(protectedCalls).toBe(2)
    })

    resolveRefresh(jsonResponse({ success: true, data: { accessToken: 'fresh-token' } }))

    const [firstResult, secondResult] = await Promise.all([firstRequest, secondRequest])
    expect(firstResult.success).toBe(true)
    expect(secondResult.success).toBe(true)
    expect(refreshCalls).toBe(1)
    expect(protectedCalls).toBe(4)
    expect(getAccessToken()).toBe('fresh-token')

    const retryCalls = fetch.mock.calls.filter(([url]) => !url.endsWith('/auth/refresh')).slice(2)
    expect(retryCalls).toHaveLength(2)
    retryCalls.forEach(([, options]) => {
      expect(options.headers.get('Authorization')).toBe('Bearer fresh-token')
    })
  })

  it('efface le jeton et notifie une seule fois lorsque le refresh partage echoue', async () => {
    setAccessToken('expired-token')
    const sessionHandler = vi.fn()
    removeSessionHandler?.()
    removeSessionHandler = onSessionExpired(sessionHandler)

    fetch.mockResolvedValue(jsonResponse({
      success: false,
      message: 'Session indisponible.',
      errorCode: 'SESSION_NOT_AVAILABLE',
    }, 401))

    const results = await Promise.allSettled([
      refreshAccessToken(),
      refreshAccessToken(),
    ])

    expect(results.map((result) => result.status)).toEqual(['rejected', 'rejected'])
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(sessionHandler).toHaveBeenCalledTimes(1)
    expect(getAccessToken()).toBeNull()
  })

  it('construit une query string en conservant false et zero', () => {
    expect(buildSearchParams({
      query: 'iphone 15',
      page: 0,
      boosted: false,
      categoryId: undefined,
      commune: '',
      nullable: null,
    })).toBe('?query=iphone+15&page=0&boosted=false')
    expect(buildSearchParams({})).toBe('')
  })

  it('relance une lecture idempotente une seule fois apres une erreur reseau', async () => {
    fetch
      .mockRejectedValueOnce(new TypeError('network down'))
      .mockResolvedValueOnce(jsonResponse({ success: true, data: { items: [] } }))

    const result = await apiRequest('/products')

    expect(result.data).toEqual({ items: [] })
    expect(fetch).toHaveBeenCalledTimes(2)
    const firstRequestId = fetch.mock.calls[0][1].headers.get('X-Request-Id')
    const secondRequestId = fetch.mock.calls[1][1].headers.get('X-Request-Id')
    expect(secondRequestId).toBe(firstRequestId)
  })

  it('relance une lecture idempotente apres une indisponibilite temporaire du serveur', async () => {
    fetch
      .mockResolvedValueOnce(jsonResponse({ success: false, message: 'Service temporairement indisponible.' }, 503))
      .mockResolvedValueOnce(jsonResponse({ success: true, data: { items: ['product-1'] } }))

    const result = await apiRequest('/products')

    expect(result.data).toEqual({ items: ['product-1'] })
    expect(fetch).toHaveBeenCalledTimes(2)
    const firstRequestId = fetch.mock.calls[0][1].headers.get('X-Request-Id')
    const secondRequestId = fetch.mock.calls[1][1].headers.get('X-Request-Id')
    expect(secondRequestId).toBe(firstRequestId)
  })
})
