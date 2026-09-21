import { describe, expect, it } from 'vitest'
import { canAdmin, hasAdminRole } from './adminAccess.js'

describe('contrôle des accès administratifs', () => {
  it('réserve l’administration aux rôles internes', () => {
    expect(hasAdminRole({ role: 'USER' })).toBe(false)
    expect(hasAdminRole({ role: 'MODERATOR' })).toBe(true)
    expect(hasAdminRole({ role: 'ADMIN' })).toBe(true)
    expect(hasAdminRole({ role: 'SUPER_ADMIN' })).toBe(true)
  })

  it('autorise la modération sans exposer les opérations financières', () => {
    const moderator = { role: 'MODERATOR' }
    expect(canAdmin(moderator, 'moderateContent')).toBe(true)
    expect(canAdmin(moderator, 'reviewSellerVerification')).toBe(true)
    expect(canAdmin(moderator, 'manageUsers')).toBe(false)
    expect(canAdmin(moderator, 'manageFinance')).toBe(false)
    expect(canAdmin(moderator, 'manageSettings')).toBe(false)
    expect(canAdmin({ role: 'ADMIN' }, 'manageUsers')).toBe(true)
  })

  it('réserve la gestion de l’équipe au super administrateur', () => {
    expect(canAdmin({ role: 'ADMIN' }, 'manageTeam')).toBe(false)
    expect(canAdmin({ role: 'SUPER_ADMIN' }, 'manageTeam')).toBe(true)
  })
})
