import AppHeader from '../../components/layout/AppHeader.jsx'
import MainLayout from '../../components/layout/MainLayout.jsx'
import CategoryPills from '../../components/marketplace/CategoryPills.jsx'
import { GuestHero } from '../../components/marketplace/HeroBanner.jsx'
import ProductSection from '../../components/marketplace/ProductSection.jsx'
import { boostedProducts, recentProducts } from '../../data/products.js'

export default function HomeGuest() {
  return (
    <MainLayout connected={false}>
      <AppHeader connected={false} />
      <div className="desktop-container">
        <CategoryPills />
        <GuestHero />
        <ProductSection title="Annonces boostées" products={boostedProducts} horizontal />
        <ProductSection title="Produits récents" products={recentProducts} />
      </div>
    </MainLayout>
  )
}
