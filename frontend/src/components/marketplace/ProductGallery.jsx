import { useMemo, useState } from 'react'
import { Maximize2, X } from 'lucide-react'
import { cn } from '../../lib/utils.js'

export default function ProductGallery({ product }) {
  const images = useMemo(() => [...new Set([product.gallery, product.image].filter(Boolean))], [product.gallery, product.image])
  const [activeIndex, setActiveIndex] = useState(0)
  const [zoomed, setZoomed] = useState(false)
  const activeImage = images[activeIndex] ?? product.image

  return (
    <>
      <div className="overflow-hidden rounded-lg border border-fifow-border bg-white">
        <button type="button" onClick={() => setZoomed(true)} className="group relative block aspect-[4/3] w-full overflow-hidden bg-slate-100" aria-label="Agrandir la photo">
          <img src={activeImage} alt={product.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.015]" />
          <span className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-lg bg-white/95 text-fifow-dark shadow-card backdrop-blur">
            <Maximize2 className="h-5 w-5" />
          </span>
        </button>
        {images.length > 1 ? (
          <div className="flex gap-2 border-t border-fifow-border p-3">
            {images.map((image, index) => (
              <button
                key={image}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={cn('h-16 w-20 overflow-hidden rounded-md border-2 bg-white p-0.5 transition', index === activeIndex ? 'border-fifow-primary' : 'border-transparent hover:border-violet-200')}
                aria-label={`Afficher la photo ${index + 1}`}
              >
                <img src={image} alt="" className="h-full w-full rounded object-cover" />
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {zoomed ? (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/90 p-4" role="dialog" aria-modal="true" aria-label="Photo agrandie">
          <button type="button" onClick={() => setZoomed(false)} aria-label="Fermer" className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-lg bg-white text-fifow-dark">
            <X className="h-6 w-6" />
          </button>
          <img src={activeImage} alt={product.title} className="max-h-[88vh] max-w-[94vw] rounded-lg object-contain" />
        </div>
      ) : null}
    </>
  )
}
