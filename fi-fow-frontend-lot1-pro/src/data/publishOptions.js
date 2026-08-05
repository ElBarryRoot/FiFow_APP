export const productConditions = [
  { value: 'NEW', label: 'Neuf' },
  { value: 'LIKE_NEW', label: 'Très bon état' },
  { value: 'GOOD', label: 'Bon état' },
  { value: 'FAIR', label: 'État correct' },
  { value: 'TO_REPAIR', label: 'À réparer' },
]

export const communes = ['Kaloum', 'Dixinn', 'Matam', 'Ratoma', 'Matoto']

export const quartiersByCommune = {
  Kaloum: ['Almamya', 'Boulbinet', 'Coronthie', 'Tombo'],
  Dixinn: ['Dixinn Centre', 'Bellevue', 'Hafia', 'Landréah'],
  Matam: ['Madina', 'Bonfi', 'Coléah', 'Matam Centre'],
  Ratoma: ['Kaporo', 'Kipé', 'Hamdallaye', 'Taouyah', 'Bambeto'],
  Matoto: ['Lansanaya', 'Sangoyah', 'Entag', 'Yimbaya', 'Gbessia'],
}

export const deliveryOptions = [
  { id: 'HAND_TO_HAND', title: 'Remise en main propre', description: 'Rencontre et remise en personne', icon: 'Handshake', tone: 'violet' },
  { id: 'HOME_DELIVERY', title: 'Livraison à domicile', description: 'Modalités confirmées avec l’acheteur', icon: 'Truck', tone: 'orange' },
  { id: 'PICKUP_POINT', title: 'Point de retrait', description: 'Remise dans un lieu convenu', icon: 'Store', tone: 'green' },
]

export const defaultDraftProduct = {
  title: '',
  description: '',
  categoryId: '',
  subcategoryId: '',
  condition: 'LIKE_NEW',
  negotiable: true,
  price: '',
  commune: 'Ratoma',
  quartier: 'Kaporo',
  handoverModes: ['HAND_TO_HAND'],
  photos: [],
}

