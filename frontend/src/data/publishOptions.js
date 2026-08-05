import { detailProduct } from './products.js'

export const productConditions = [
  'Neuf',
  'Très bon état',
  'Bon état',
  'État correct',
  'À réparer',
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
  {
    id: 'hand_delivery',
    title: 'Remise en main propre',
    description: 'Rencontre et remise en personne',
    icon: 'Handshake',
    tone: 'violet',
  },
  {
    id: 'home_delivery',
    title: 'Livraison à domicile',
    description: 'Frais à la charge de l’acheteur',
    icon: 'Truck',
    tone: 'orange',
  },
  {
    id: 'pickup_point',
    title: 'Point de retrait',
    description: 'Remise dans un point de retrait',
    icon: 'Store',
    tone: 'green',
  },
]

export const samplePublishPhotos = [
  detailProduct.image,
  '/assets/shoe.png',
  '/assets/bag.png',
  '/assets/sofa.png',
  '/assets/car.png',
]

export const defaultDraftProduct = {
  title: '',
  description: '',
  category: '',
  condition: 'Très bon état',
  negotiable: true,
  price: '',
  commune: 'Ratoma',
  quartier: 'Kaporo',
  deliveryMode: 'hand_delivery',
  photos: [],
}

export const previewDraftProduct = {
  ...defaultDraftProduct,
  category: 'Téléphones',
  title: 'iPhone 13 Pro Max 256Go',
  description:
    'iPhone 13 Pro Max 256Go en très bon état, toujours protégé avec coque et verre trempé. Aucune rayure, batterie à 89%. Tout fonctionne parfaitement. Boîte et accessoires d’origine inclus.',
  price: '7500000',
  photos: samplePublishPhotos,
}
