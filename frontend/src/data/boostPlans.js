export const boostBenefits = [
  { label: 'Plus de vues', detail: "Jusqu'à 10x plus" },
  { label: 'Plus de visibilité', detail: 'En tête des résultats' },
  { label: "Plus d’acheteurs", detail: 'Contacts qualifiés' },
]

export const boostPlans = [
  {
    id: 'boost-24h',
    label: 'EXPRESS',
    name: 'Boost 24h',
    duration: '24h',
    price: 10000,
    oldPrice: 12000,
    multiplier: '3x',
    tone: 'orange',
    description: 'Idéal pour un coup de boost rapide.',
    features: ['En tête des résultats pendant 24h', "Jusqu’à 3x plus de vues", 'Badge Boost sur votre annonce', 'Couleur orange dans les résultats'],
    highlight: 'Effet immédiat',
  },
  {
    id: 'boost-3-days',
    label: 'LE PLUS POPULAIRE',
    name: 'Boost 3 jours',
    duration: '3 jours',
    price: 25000,
    oldPrice: 30000,
    multiplier: '6x',
    tone: 'purple',
    popular: true,
    description: 'Plus de visibilité, plus de chances.',
    features: ['En tête des résultats pendant 3 jours', "Jusqu’à 6x plus de vues", 'Badge Boost sur votre annonce', 'Couleur orange dans les résultats', 'Remontées automatiques'],
    highlight: 'Meilleur rapport qualité',
  },
  {
    id: 'boost-7-days',
    label: 'MAXI VISIBILITÉ',
    name: 'Boost 7 jours',
    duration: '7 jours',
    price: 45000,
    oldPrice: 60000,
    multiplier: '10x',
    tone: 'green',
    description: 'Dominez votre catégorie toute la semaine.',
    features: ['En tête des résultats pendant 7 jours', "Jusqu’à 10x plus de vues", 'Badge Boost sur votre annonce', 'Couleur orange dans les résultats', 'Remontées automatiques', 'Priorité sur les nouvelles annonces'],
    highlight: 'Performance maximale',
  },
]

export const selectedBoostPlan = {
  id: 'boost-premium',
  name: 'Boost Premium',
  duration: '7 jours',
  views: "Jusqu'à 10x plus de vues",
  priority: 'Élevée',
  price: 49000,
  description: 'Plus de visibilité, plus de contacts',
}

export const boostProduct = {
  id: 'iphone-13-pro',
  title: 'iPhone 13 Pro 128 Go',
  condition: 'Très bon état',
  location: 'Conakry, Dixinn',
  price: 4500000,
  image: '/assets/phone.png',
  photosCount: 8,
}

export const boostGains = [
  "Jusqu’à 10x plus de vues",
  'Plus de messages',
  'Meilleur classement',
  'Badge Boost sur votre annonce',
]
