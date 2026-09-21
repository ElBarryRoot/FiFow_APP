import { API_BASE_URL } from './config.js'
import { ApiError } from './errors.js'

let accessToken = null
let refreshPromise = null
let sessionExpiredHandler = null

const IDEMPOTENT_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])
const RETRYABLE_STATUSES = new Set([408, 429, 500, 502, 503, 504])

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

function createRequestId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
}

function sleep(ms, signal) {
  if (signal?.aborted) return Promise.reject(signal.reason)
  return new Promise((resolve, reject) => {
    const timeoutId = window.setTimeout(resolve, ms)
    const onAbort = () => {
      window.clearTimeout(timeoutId)
      reject(signal.reason)
    }
    signal?.addEventListener('abort', onAbort, { once: true })
  })
}

function retryDelay(attempt, response) {
  const retryAfter = response?.headers?.get?.('retry-after')
  const retryAfterSeconds = Number(retryAfter)
  if (Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0) return Math.min(retryAfterSeconds * 1000, 3000)
  return Math.min(250 * (2 ** attempt), 1200) + Math.floor(Math.random() * 120)
}

function shouldRetry({ method, attempt, maxRetries, response, error, externalSignal }) {
  if (attempt >= maxRetries || externalSignal?.aborted) return false
  if (!IDEMPOTENT_METHODS.has(method.toUpperCase())) return false
  if (response) return RETRYABLE_STATUSES.has(response.status)
  return error?.status === 0 || RETRYABLE_STATUSES.has(error?.status)
}

async function execute(path, options = {}) {
  const {
    method = 'GET',
    body,
    headers: providedHeaders,
    signal: externalSignal,
    timeoutMs = 15_000,
    token = accessToken,
    requestId = createRequestId(),
  } = options
  const headers = new Headers(providedHeaders)
  const isFormData = body instanceof FormData

  if (body !== undefined && !isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  if (token) headers.set('Authorization', `Bearer ${token}`)
  headers.set('Accept', 'application/json')
  headers.set('X-Request-Id', requestId)

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
  const method = requestOptions.method || 'GET'
  const maxRetries = requestOptions.retry ?? (method.toUpperCase() === 'GET' ? 1 : 0)
  const requestId = requestOptions.requestId || createRequestId()

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    try {
      return await execute(path, { ...requestOptions, requestId, retry: 0 })
    } catch (error) {
      const canRefresh = error.status === 401 && auth !== 'none' && retryAuth && !path.startsWith('/auth/refresh')
      if (canRefresh) {
        await refreshAccessToken()
        return execute(path, { ...requestOptions, requestId, retry: 0 })
      }
      if (shouldRetry({ method, attempt, maxRetries, error, externalSignal: requestOptions.signal })) {
        await sleep(retryDelay(attempt), requestOptions.signal)
        continue
      }
      throw error
    }
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
