import { describe, expect, it } from 'vitest'
import { formatGNF } from './formatters.js'

describe('formatGNF', () => {
  it('formate les montants usuels', () => {
    expect(formatGNF(204500)).toContain('204')
    expect(formatGNF(204500)).toContain('500')
    expect(formatGNF(204500)).toContain('GNF')
  })

  it('conserve exactement les grands montants reçus sous forme de chaîne', () => {
    const formatted = formatGNF('99000000000000000').replace(/\s/g, '')
    expect(formatted).toBe('99000000000000000GNF')
  })
})
