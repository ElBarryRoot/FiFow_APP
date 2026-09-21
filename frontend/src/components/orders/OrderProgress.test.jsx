import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import OrderProgress from './OrderProgress.jsx'

describe('OrderProgress', () => {
  it('met en avant l action attendue par l acheteur', () => {
    render(
      <OrderProgress
        userId="buyer-1"
        order={{ buyerId: 'buyer-1', sellerId: 'seller-1', status: 'AWAITING_PAYMENT' }}
      />,
    )

    expect(screen.getByText('Étape 2 sur 5')).toBeInTheDocument()
    expect(screen.getByText('Réglez le montant affiché pour lancer la préparation.')).toBeInTheDocument()
    expect(screen.getByRole('list', { name: 'Étapes de la commande' })).toBeInTheDocument()
  })

  it('indique une commande terminée sans proposer de nouvelles étapes', () => {
    render(<OrderProgress userId="buyer-1" order={{ buyerId: 'buyer-1', status: 'COMPLETED' }} />)

    expect(screen.getByText('Commande terminée')).toBeInTheDocument()
    expect(screen.getAllByText('Étape terminée')).toHaveLength(5)
    expect(screen.queryByText('À venir')).not.toBeInTheDocument()
  })

  it('explique un dossier en cours d examen sans afficher de prochaines étapes', () => {
    render(<OrderProgress userId="buyer-1" order={{ buyerId: 'buyer-1', status: 'DISPUTED' }} />)

    expect(screen.getByText('Dossier en cours d’examen')).toBeInTheDocument()
    expect(screen.queryByRole('list', { name: 'Étapes de la commande' })).not.toBeInTheDocument()
  })
})
