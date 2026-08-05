import { Car, Grid2X2, Home, Monitor, Smartphone, Shirt, Sparkles } from 'lucide-react'

export const categories = [
  { id: 'mode', label: 'Mode', icon: Shirt, color: 'text-fifow-primary', bg: 'bg-fifow-lavender' },
  { id: 'telephones', label: 'Téléphones', icon: Smartphone, color: 'text-sky-500', bg: 'bg-sky-50' },
  { id: 'maison', label: 'Maison', icon: Home, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  { id: 'auto', label: 'Auto', icon: Car, color: 'text-orange-500', bg: 'bg-orange-50' },
  { id: 'electronique', label: 'Électronique', icon: Monitor, color: 'text-violet-600', bg: 'bg-violet-50' },
  { id: 'plus', label: 'Plus', icon: Grid2X2, color: 'text-fifow-dark', bg: 'bg-slate-50', connectedOnly: true },
]

export const heroTags = [
  { id: 'secure', label: 'Sécurisé', icon: Sparkles },
  { id: 'local', label: 'Local', icon: Home },
]
