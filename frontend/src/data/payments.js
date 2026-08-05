export const paymentMethods = [
  {
    id: 'mobile_money',
    title: 'Mobile Money',
    description: 'Payez facilement et en toute sécurité.',
    recommended: true,
    brands: ['MTN', 'Orange', 'Moov', 'Airtel'],
  },
  {
    id: 'cash_on_delivery',
    title: 'Paiement à la livraison',
    description: 'Payez en espèces à la réception de votre commande.',
    brands: [],
  },
  {
    id: 'card',
    title: 'Carte bancaire',
    description: 'Visa et Mastercard, selon disponibilité.',
    brands: ['VISA', 'MC'],
  },
]

export const checkoutOrder = {
  id: 'order-ff-7g8x',
  reference: 'FF-2025-05-24-7G8X',
  product: {
    id: 'nike-air-force',
    title: "Nike Air Force 1 '07",
    meta: 'Taille 42 • Blanc / Vert',
    image: '/assets/shoe.png',
    seller: 'Conakry Style',
  },
  subtotal: 450000,
  serviceFee: 10000,
  deliveryFee: 15000,
  currency: 'GNF',
}

export const processingPayment = {
  orderReference: 'FF-2025-05-24-7G8X',
  amount: 1250000,
  status: 'En vérification',
}

export const paymentReceipt = {
  reference: 'FF-250525-7X9B2',
  label: 'Commande Fi Fow',
  amount: 1250000,
  method: 'Orange Money',
  paidAt: '25 mai 2025 à 14:32',
  transactionReference: 'OM2505251432458',
}

export function getCheckoutTotal(order) {
  return order.subtotal + order.serviceFee + order.deliveryFee
}
