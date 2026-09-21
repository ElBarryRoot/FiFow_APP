const configuredApiUrl = import.meta.env.VITE_API_URL?.trim()
const browserHost = typeof window !== 'undefined' ? window.location.hostname : ''
const isLocalBrowser = !browserHost || ['localhost', '127.0.0.1', '[::1]'].includes(browserHost)

// En développement, une session ouverte depuis un téléphone doit rester sur
// la même origine Vite. Le proxy relaie ensuite /api et /uploads vers l’API PC.
// En production, VITE_API_URL reste obligatoire et conserve l’URL publique.
export const API_BASE_URL = (configuredApiUrl || (isLocalBrowser ? 'http://localhost:5000/api/v1' : '/api/v1')).replace(/\/$/, '')
export const API_ORIGIN = new URL(API_BASE_URL, typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173').origin

export function resolveMediaUrl(value) {
  if (!value || value.startsWith('/')) return value
  try {
    const url = new URL(value)
    if (['localhost', '127.0.0.1', '::1'].includes(url.hostname) && !isLocalBrowser) {
      return `${url.pathname}${url.search}${url.hash}`
    }
    return url.toString()
  } catch {
    return value
  }
}
