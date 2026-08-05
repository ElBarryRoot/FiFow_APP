const configuredApiUrl = import.meta.env.VITE_API_URL?.trim()

export const API_BASE_URL = (configuredApiUrl || 'http://localhost:5000/api/v1').replace(/\/$/, '')
export const API_ORIGIN = new URL(API_BASE_URL).origin

