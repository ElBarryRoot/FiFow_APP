import { describe, expect, it } from 'vitest'
import { buildLocalDescriptionDraft } from './descriptionAssistant.js'

describe('buildLocalDescriptionDraft', () => {
  it('creates a concise description without placeholders or category repetition', () => {
    const description = buildLocalDescriptionDraft({
      title: 'iPhone 13 256 Go',
      categoryName: 'Téléphones',
      subcategoryName: 'Smartphones',
      conditionLabel: 'Très bon état',
    })

    expect(description).toBe('iPhone 13 256 Go en très bon état, propre et prêt à l’emploi. Contactez-moi via Fi Fow pour convenir de la remise.')
    expect(description).not.toContain('[')
    expect(description).not.toContain('Téléphones')
  })

  it('keeps every suggestion within 24 words', () => {
    const description = buildLocalDescriptionDraft({
      title: 'iPhone 13 Pro Max 256 Go bleu avec coque de protection',
      conditionLabel: 'Très bon état avec une légère trace',
    })

    expect(description.match(/\S+/gu)).toHaveLength(24)
    expect(description).toContain('Contactez-moi via Fi Fow pour convenir de la remise.')
  })
})
