import { API_BASE_URL } from './config.js'
import { ApiError } from './errors.js'

let accessToken = null
let refreshPromise = null
let sessionExpiredHandler = null

const sessionErrors = new Set([
  'INVALID_REFRESH_TOKEN',
  'REFRESH_TOKEN_REUSED',
  'REFRESH_CONFLICT',
  'REFRESH_TOKEN_REQUIRED',
  'SESSION_NOT_AVAILABLE',
])

export function getAccessToken() {
  return accessToken
}

export function setAccessToken(token) {
  accessToken = token || null
}

export function clearAccessToken() {
  accessToken = null
}

export function onSessionExpired(handler) {
  sessionExpiredHandler = handler
  return () => {
    if (sessionExpiredHandler === handler) sessionExpiredHandler = null
  }
}

function createRequestSignal(externalSignal, timeoutMs) {
  const controller = new AbortController()
  let timedOut = false
  const abortFromExternal = () => controller.abort(externalSignal?.reason)

  if (externalSignal?.aborted) abortFromExternal()
  else externalSignal?.addEventListener('abort', abortFromExternal, { once: true })

  const timeoutId = window.setTimeout(() => {
    timedOut = true
    controller.abort(new DOMException('Request timeout', 'TimeoutError'))
  }, timeoutMs)

  return {
    signal: controller.signal,
    didTimeOut: () => timedOut,
    cleanup() {
      window.clearTimeout(timeoutId)
      externalSignal?.removeEventListener('abort', abortFromExternal)
    },
  }
}

async function parseResponse(response) {
  if (response.status === 204) return null
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) return null
  return response.json()
}

async function execute(path, options = {}) {
  const {
    method = 'GET',
    body,
    headers: providedHeaders,
    signal: externalSignal,
    timeoutMs = 15_000,
    token = accessToken,
  } = options
  const headers = new Headers(providedHeaders)
  const isFormData = body instanceof FormData

  if (body !== undefined && !isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  if (token) headers.set('Authorization', `Bearer ${token}`)
  headers.set('Accept', 'application/json')

  const requestSignal = createRequestSignal(externalSignal, timeoutMs)
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      credentials: 'include',
      body: body === undefined || isFormData ? body : JSON.stringify(body),
      signal: requestSignal.signal,
    })
    const payload = await parseResponse(response)
    if (!response.ok || payload?.success === false) {
      throw new ApiError({
        status: response.status,
        code: payload?.errorCode || `HTTP_${response.status}`,
        message: payload?.message || 'La requête n’a pas pu aboutir.',
        details: payload?.details,
        requestId: payload?.requestId || response.headers.get('x-request-id') || undefined,
      })
    }
    return payload
  } catch (error) {
    if (error instanceof ApiError) throw error
    if (requestSignal.didTimeOut()) {
      throw new ApiError({ status: 408, code: 'REQUEST_TIMEOUT', message: 'Le serveur met trop de temps à répondre.', cause: error })
    }
    if (externalSignal?.aborted) throw error
    throw new ApiError({ status: 0, code: 'NETWORK_ERROR', message: 'Impossible de joindre le serveur Fi Fow.', cause: error })
  } finally {
    requestSignal.cleanup()
  }
}

export async function refreshAccessToken({ notify = true } = {}) {
  if (!refreshPromise) {
    refreshPromise = execute('/auth/refresh', { method: 'POST', token: null })
      .then((response) => {
        const token = response?.data?.accessToken
        if (!token) throw new ApiError({ status: 401, code: 'INVALID_REFRESH_RESPONSE', message: 'Session invalide.' })
        setAccessToken(token)
        return response.data
      })
      .catch((error) => {
        clearAccessToken()
        if (notify && (error.status === 401 || sessionErrors.has(error.code))) sessionExpiredHandler?.(error)
        throw error
      })
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

export async function apiRequest(path, options = {}) {
  const { auth = 'optional', retryAuth = true, ...requestOptions } = options
  try {
    return await execute(path, requestOptions)
  } catch (error) {
    const canRefresh = error.status === 401 && auth !== 'none' && retryAuth && !path.startsWith('/auth/refresh')
    if (!canRefresh) throw error
    await refreshAccessToken()
    return execute(path, requestOptions)
  }
}

export function buildSearchParams(values) {
  const params = new URLSearchParams()
  Object.entries(values).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    params.set(key, String(value))
  })
  const query = params.toString()
  return query ? `?${query}` : ''
}

