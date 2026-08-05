import { Sparkles } from 'lucide-react'
import AppHeader from '../../components/layout/AppHeader.jsx'
import MainLayout from '../../components/layout/MainLayout.jsx'
import CategoryPills from '../../components/marketplace/CategoryPills.jsx'
import { ConnectedHero } from '../../components/marketplace/HeroBanner.jsx'
import ProductSection from '../../components/marketplace/ProductSection.jsx'
import { boostedProducts, recentProducts, suggestions } from '../../data/products.js'

export default function HomeConnected() {
  return (
    <MainLayout connected>
      <AppHeader connected />
      <div className="desktop-container">
        <CategoryPills connected />
        <ConnectedHero />
        <ProductSection title="Annonces boostées" products={boostedProducts} horizontal />
        <ProductSection title="Suggestions pour vous" products={suggestions} horizontal icon={Sparkles} />
        <ProductSection title="Produits récents" products={recentProducts} />
      </div>
    </MainLayout>
  )
}
