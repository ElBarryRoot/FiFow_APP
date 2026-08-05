import SectionHeader from '../ui/SectionHeader.jsx'
import ProductCard from './ProductCard.jsx'

export default function ProductSection({ title, products, horizontal = false, icon }) {
  if (horizontal) {
    return (
      <section className="mt-10">
        <SectionHeader title={title} icon={icon} />
        <div className="premium-scrollbar flex gap-4 overflow-x-auto pb-2 lg:grid lg:grid-cols-3 lg:overflow-visible">
          {products.map((product) => <ProductCard key={product.id} product={product} horizontal />)}
        </div>
      </section>
    )
  }

  return (
    <section className="mt-10">
      <SectionHeader title={title} icon={icon} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
        {products.map((product) => <ProductCard key={product.id} product={product} />)}
      </div>
    </section>
  )
}
