import { describe, expect, it } from 'vitest'
import { formatGNFInput, sanitizeGNFAmount } from './moneyInput.js'

describe('GNF amount input helpers', () => {
  it('keeps only a bounded numeric value for API submission', () => {
    expect(sanitizeGNFAmount('00 1 500 000 GNF')).toBe('1500000')
    expect(sanitizeGNFAmount('12345678901234567890')).toBe('123456789012345')
  })

  it('formats the displayed value without changing the numeric value', () => {
    expect(formatGNFInput('1500000')).toMatch(/^1[\s\u00a0\u202f]500[\s\u00a0\u202f]000$/)
  })
})
