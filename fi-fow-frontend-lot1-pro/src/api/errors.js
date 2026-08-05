export class ApiError extends Error {
  constructor({ message, status = 0, code = 'UNKNOWN_ERROR', details = [], requestId, cause }) {
    super(message, cause ? { cause } : undefined)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = Array.isArray(details) ? details : []
    this.requestId = requestId
  }

  fieldErrors() {
    return this.details.reduce((errors, detail) => {
      if (!detail?.field || !detail?.message) return errors
      const field = detail.field.replace(/^(body|query|params)\./, '')
      errors[field] = detail.message
      return errors
    }, {})
  }
}

export function isApiError(error) {
  return error instanceof ApiError
}

export function errorMessage(error, fallback = 'Une erreur est survenue. Réessayez.') {
  return isApiError(error) ? error.message : fallback
}

