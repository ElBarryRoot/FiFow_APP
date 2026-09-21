export const userProfile = {
  name: 'Aissatou Diallo',
  shortName: 'Aissatou',
  avatar: '/assets/avatar-aissatou.svg',
  location: 'Conakry, Ratoma',
  neighborhood: 'Kipé',
  phone: '+224 620 12 34 56',
  email: 'aissatou.diallo@email.com',
  memberSince: 'mars 2024',
  rating: 4.7,
  responseRate: '92%',
  responseTime: 'Répond souvent en moins de 20 min',
  trustLine: 'Profil vérifié, téléphone confirmé, échanges sécurisés sur Fi Fow.',
  verified: true,
  stats: [
    { label: 'Annonces en ligne', value: '8', helper: 'dont 2 boostées' },
    { label: 'Favoris reçus', value: '124', helper: 'sur 30 jours' },
    { label: 'Ventes réalisées', value: '31', helper: 'avis 4,7/5' },
  ],
}

export const publicSeller = {
  name: 'Mamadou Camara',
  avatar: '/assets/avatar-mamadou.svg',
  location: 'Conakry, Ratoma',
  memberSince: 'mars 2023',
  rating: 4.8,
  reviews: 132,
  sales: 128,
  responseTime: 'Répond généralement vite',
  responseRate: '96%',
  lastSeen: 'Actif il y a 12 min',
  trustLine: 'Vendeur vérifié avec historique de ventes et avis positifs.',
  verified: true,
}

export const myListings = [
  {
    id: 'iphone-13-pro-max',
    title: 'iPhone 13 Pro Max 256Go',
    price: 7500000,
    location: 'Ratoma, Kipé',
    image: '/assets/phone.png',
    status: 'En ligne',
    condition: 'Très bon état',
    buyerSignal: 'Très demandé à Kipé',
    views: 2458,
    favorites: 42,
    messages: 12,
    publishedAt: 'Publié aujourd’hui',
    boosted: true,
  },
  {
    id: 'sofa-modern',
    title: 'Canapé 3 places - tissu beige',
    price: 3800000,
    location: 'Dixinn, Camayenne',
    image: '/assets/sofa.png',
    status: 'En ligne',
    condition: 'Bon état',
    buyerSignal: '6 messages cette semaine',
    views: 1324,
    favorites: 18,
    messages: 6,
    publishedAt: 'Publié hier',
  },
  {
    id: 'nike-air-force',
    title: 'Nike Air Force 1 blanc',
    price: 900000,
    location: 'Matam, Madina',
    image: '/assets/shoe.png',
    status: 'En attente',
    condition: 'Neuf',
    buyerSignal: 'Validation Fi Fow',
    views: 0,
    favorites: 0,
    messages: 0,
    publishedAt: 'Validation en cours',
  },
]

export const favoriteListings = [
  {
    id: 'gucci-bag',
    title: 'Sac dame élégant',
    price: 250000,
    location: 'Dixinn, Hafia',
    image: '/assets/bag.png',
    seller: 'Mamadou Camara',
    condition: 'Très bon état',
    response: 'Répond vite',
    savedAt: 'Ajouté il y a 2 h',
    negotiable: true,
  },
  {
    id: 'samsung-tv',
    title: 'TV Samsung 55” UHD 4K',
    price: 3200000,
    location: 'Matoto, Sangoyah',
    image: '/assets/tv.png',
    seller: 'Conakry Tech',
    condition: 'Bon état',
    response: 'Boutique vérifiée',
    savedAt: 'Ajouté hier',
  },
  {
    id: 'blender',
    title: 'Blender 3 en 1',
    price: 650000,
    location: 'Kaloum, Almamya',
    image: '/assets/blender.png',
    seller: 'Fatou Boutique',
    condition: 'Neuf',
    response: 'Livraison possible',
    savedAt: 'Ajouté cette semaine',
  },
]

export const conversations = [
  {
    id: 'conv-1',
    seller: 'Mamadou Camara',
    avatar: '/assets/avatar-mamadou.svg',
    product: 'Sac dame élégant',
    image: '/assets/bag.png',
    lastMessage: 'Bonjour, le sac est toujours disponible ?',
    time: '12:45',
    unread: 2,
    online: true,
    price: 250000,
    location: 'Ratoma, Bambeto',
  },
  {
    id: 'conv-2',
    seller: 'Conakry Style',
    avatar: '/assets/avatar-aissatou.svg',
    product: 'Nike Air Force 1 blanc',
    image: '/assets/shoe.png',
    lastMessage: 'Oui, remise possible à Madina.',
    time: 'Hier',
    unread: 0,
    online: false,
    price: 900000,
    location: 'Matam, Madina',
  },
  {
    id: 'conv-3',
    seller: 'Alpha Tech',
    avatar: '/assets/avatar-mamadou.svg',
    product: 'TV Samsung 55” UHD 4K',
    image: '/assets/tv.png',
    lastMessage: 'Je peux passer voir aujourd’hui ?',
    time: 'Lun.',
    unread: 1,
    online: true,
    price: 3200000,
    location: 'Matoto, Sangoyah',
  },
]

export const conversationMessages = [
  { id: 1, from: 'seller', text: 'Bonjour, le sac est disponible. Il est en très bon état.', time: '12:38' },
  { id: 2, from: 'me', text: 'Bonjour, vous êtes à Ratoma exactement où ?', time: '12:40' },
  { id: 3, from: 'seller', text: 'Vers Bambeto, remise possible à Kipé aussi.', time: '12:42' },
  { id: 4, from: 'me', text: 'D’accord. Le prix est négociable ?', time: '12:45' },
]

export const notifications = [
  { id: 1, title: 'Nouveau message', description: 'Mamadou a répondu à votre demande sur le sac dame élégant.', time: 'Il y a 5 min', type: 'message', unread: true },
  { id: 2, title: 'Paiement confirmé', description: 'Votre paiement de 1 250 000 GNF a été validé.', time: 'Aujourd’hui', type: 'payment' },
  { id: 3, title: 'Annonce boostée', description: 'Votre annonce iPhone 13 Pro gagne plus de visibilité.', time: 'Hier', type: 'boost' },
  { id: 4, title: 'Nouvel avis reçu', description: 'Un acheteur vous a laissé une note de 5/5.', time: 'Cette semaine', type: 'review' },
]

export const profileChecklist = [
  { label: 'Téléphone confirmé', done: true },
  { label: 'Email de récupération ajouté', done: true },
  { label: 'Photo de profil claire', done: true },
  { label: 'Quartier renseigné', done: true },
]

export const sellerReviews = [
  { name: 'Aminata B.', note: 5, text: 'Vendeur sérieux, produit conforme et remise rapide à Kipé.' },
  { name: 'Ousmane D.', note: 4, text: 'Bonne communication, prix discuté calmement avant la rencontre.' },
]

export const orders = [
  {
    id: 'order-1',
    reference: 'FF-2025-05-24-7G8X',
    product: 'Nike Air Force 1 blanc',
    image: '/assets/shoe.png',
    seller: 'Conakry Style',
    amount: 475000,
    status: 'Livrée',
    date: '24 mai 2025',
    delivery: 'Remise en main propre à Madina',
  },
  {
    id: 'order-2',
    reference: 'FF-2025-05-21-9T4K',
    product: 'Sac dame élégant',
    image: '/assets/bag.png',
    seller: 'Mamadou Camara',
    amount: 250000,
    status: 'En cours',
    date: '21 mai 2025',
    delivery: 'Point de rencontre à Kipé',
  },
  {
    id: 'order-3',
    reference: 'FF-2025-05-18-2P1M',
    product: 'Blender 3 en 1',
    image: '/assets/blender.png',
    seller: 'Fatou Boutique',
    amount: 650000,
    status: 'En vérification',
    date: '18 mai 2025',
    delivery: 'Livraison à domicile',
  },
]

export const orderTimeline = [
  { label: 'Commande créée', date: '24 mai 2025 - 10:20', done: true },
  { label: 'Paiement validé', date: '24 mai 2025 - 10:24', done: true },
  { label: 'Vendeur contacté', date: '24 mai 2025 - 10:35', done: true },
  { label: 'Commande livrée', date: '24 mai 2025 - 16:10', done: true },
]

export const quickHelpCards = [
  { title: 'Paiement bloqué', text: 'Ajoutez la référence et le numéro utilisé pour vérifier plus vite.' },
  { title: 'Annonce suspecte', text: 'Signalez sans discuter hors plateforme si le vendeur demande une avance.' },
  { title: 'Compte perdu', text: 'Utilisez plusieurs preuves fortes pour protéger votre identité.' },
]

export const supportTopics = [
  'Problème avec une commande',
  'Signaler une annonce',
  'Paiement ou remboursement',
  'Compte ou mot de passe',
  'Boost et visibilité',
]
