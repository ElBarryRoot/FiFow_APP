import { describe, expect, it } from 'vitest'
import { buildLocalDescriptionDraft } from './descriptionAssistant.js'

describe('buildLocalDescriptionDraft', () => {
  it('reuses seller inputs without inventing product characteristics', () => {
    const description = buildLocalDescriptionDraft({
      title: 'iPhone 13 256 Go',
      categoryName: 'Téléphones',
      subcategoryName: 'Smartphones',
      conditionLabel: 'Très bon état',
    })

    expect(description).toContain('Je vends iPhone 13 256 Go.')
    expect(description).toContain('État indiqué : Très bon état.')
    expect(description).toContain('Téléphones - Smartphones')
    expect(description).toContain('[modèle, taille, dimensions ou informations utiles]')
  })

  it('normalizes untrusted title whitespace before adding it to the draft', () => {
    const description = buildLocalDescriptionDraft({ title: '  Sac   à   porter  ' })

    expect(description).toContain('Je vends Sac à porter.')
  })
})
