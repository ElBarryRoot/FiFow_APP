import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import OrderActions from './OrderActions.jsx'

function renderActions(props) {
  return render(
    <MemoryRouter>
      <OrderActions onAction={vi.fn()} onReasonAction={vi.fn()} pendingAction={null} {...props} />
    </MemoryRouter>,
  )
}

describe('OrderActions', () => {
  it('met le paiement en avant pour l acheteur', () => {
    renderActions({
      userId: 'buyer-1',
      order: {
        id: 'order-1',
        buyerId: 'buyer-1',
        sellerId: 'seller-1',
        status: 'AWAITING_PAYMENT',
        availableActions: ['PAY'],
      },
    })

    const paymentLink = screen.getByRole('link', { name: 'Payer en sécurité' })
    expect(paymentLink).toHaveAttribute('href', '/checkout/order-1')
    expect(screen.getByText('Prochaine action')).toBeInTheDocument()
  })

  it('envoie une confirmation vendeur avec la bonne action', () => {
    const onAction = vi.fn()
    render(
      <MemoryRouter>
        <OrderActions
          userId="seller-1"
          pendingAction={null}
          onAction={onAction}
          onReasonAction={vi.fn()}
          order={{
            id: 'order-1',
            buyerId: 'buyer-1',
            sellerId: 'seller-1',
            status: 'AWAITING_SELLER_CONFIRMATION',
            availableActions: ['SELLER_CONFIRM'],
          }}
        />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Confirmer la disponibilité' }))
    expect(onAction).toHaveBeenCalledWith('seller-confirm')
  })

  it('laisse les actions sensibles accessibles sans rivaliser avec l action principale', () => {
    renderActions({
      userId: 'buyer-1',
      order: {
        id: 'order-1',
        buyerId: 'buyer-1',
        sellerId: 'seller-1',
        status: 'AWAITING_PAYMENT',
        availableActions: ['PAY', 'CANCEL'],
      },
    })

    expect(screen.getByRole('button', { name: 'Annuler la commande' })).toBeInTheDocument()
    expect(screen.getByText('Besoin d’aide')).toBeInTheDocument()
  })
})
