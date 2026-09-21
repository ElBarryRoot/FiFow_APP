import { describe, expect, it } from 'vitest'
import { ApiError, errorMessage, isApiError } from './errors.js'

describe('ApiError', () => {
  it('expose les informations utiles du contrat backend', () => {
    const cause = new Error('socket ferme')
    const error = new ApiError({
      message: 'Donnees invalides',
      status: 422,
      code: 'VALIDATION_ERROR',
      requestId: 'req-42',
      cause,
      details: [
        { field: 'body.email', message: 'Email invalide' },
        { field: 'query.page', message: 'Page invalide' },
        { field: 'params.productId', message: 'Produit introuvable' },
        { field: 'body.profile.commune', message: 'Commune requise' },
      ],
    })

    expect(error).toBeInstanceOf(Error)
    expect(error.name).toBe('ApiError')
    expect(error.status).toBe(422)
    expect(error.code).toBe('VALIDATION_ERROR')
    expect(error.requestId).toBe('req-42')
    expect(error.cause).toBe(cause)
    expect(error.fieldErrors()).toEqual({
      email: 'Email invalide',
      page: 'Page invalide',
      productId: 'Produit introuvable',
      'profile.commune': 'Commune requise',
    })
  })

  it('ignore les details incomplets et protege contre un format inattendu', () => {
    const malformedDetails = new ApiError({
      message: 'Erreur',
      details: [{ field: 'body.email' }, { message: 'Sans champ' }, null],
    })
    const nonArrayDetails = new ApiError({ message: 'Erreur', details: { field: 'body.email' } })

    expect(malformedDetails.fieldErrors()).toEqual({})
    expect(nonArrayDetails.details).toEqual([])
    expect(nonArrayDetails.fieldErrors()).toEqual({})
  })

  it('distingue une erreur API et conserve un message de repli pour les autres erreurs', () => {
    const apiError = new ApiError({ message: 'Session expiree', code: 'SESSION_EXPIRED' })

    expect(isApiError(apiError)).toBe(true)
    expect(isApiError(new Error('erreur locale'))).toBe(false)
    expect(errorMessage(apiError, 'Repli')).toBe('Session expiree')
    expect(errorMessage(new Error('erreur locale'), 'Repli')).toBe('Repli')
  })
})
