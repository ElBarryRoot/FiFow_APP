import { StrictMode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import VerifyEmail from './VerifyEmail.jsx'

const { verifyEmail, refreshUser } = vi.hoisted(() => ({
  verifyEmail: vi.fn(),
  refreshUser: vi.fn(),
}))

vi.mock('../../api/auth.js', () => ({
  authApi: { verifyEmail },
}))

vi.mock('../../auth/AuthContext.jsx', () => ({
  useAuth: () => ({ isAuthenticated: false, refreshUser }),
}))

describe('VerifyEmail', () => {
  beforeEach(() => {
    verifyEmail.mockReset()
    refreshUser.mockReset()
  })

  it('ne consomme le jeton qu’une fois sous React StrictMode', async () => {
    verifyEmail.mockResolvedValue({ message: 'Adresse email vérifiée.' })

    render(
      <StrictMode>
        <MemoryRouter initialEntries={['/verify-email?token=token-strict-mode-unique']}>
          <VerifyEmail />
        </MemoryRouter>
      </StrictMode>,
    )

    expect(await screen.findByText('Email vérifié')).toBeInTheDocument()
    expect(verifyEmail).toHaveBeenCalledTimes(1)
    expect(verifyEmail).toHaveBeenCalledWith('token-strict-mode-unique')
  })

  it('refuse un lien sans jeton sans appeler l’API', () => {
    render(
      <MemoryRouter initialEntries={['/verify-email']}>
        <VerifyEmail />
      </MemoryRouter>,
    )

    expect(screen.getByText('Vérification impossible')).toBeInTheDocument()
    expect(verifyEmail).not.toHaveBeenCalled()
  })
})
