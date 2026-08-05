import { Plus, X } from 'lucide-react'
import { cn } from '../../lib/utils.js'

export default function PhotoUploadGrid({ photos, onAddSample, onRemovePhoto }) {
  const slots = Array.from({ length: Math.min(6, photos.length + 1) })
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {slots.map((_, index) => {
        const photo = photos[index]
        if (photo) {
          return (
            <div key={`${photo}-${index}`} className="relative aspect-square overflow-hidden rounded-lg bg-slate-100">
              <img src={photo} alt={`Produit ${index + 1}`} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => onRemovePhoto(index)}
                className="absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-full bg-white text-fifow-primary shadow-card transition hover:bg-fifow-lavender"
                aria-label="Supprimer la photo"
              >
                <X className="h-5 w-5" />
              </button>
              {index === 0 ? (
                <span className="absolute bottom-2 left-2 rounded-md bg-fifow-primary px-2 py-1 text-xs font-extrabold text-white">Photo principale</span>
              ) : null}
            </div>
          )
        }
        return (
          <button
            key="add-photo"
            type="button"
            onClick={onAddSample}
            disabled={photos.length >= 6}
            className={cn(
              'aspect-square rounded-lg border-2 border-dashed border-violet-200 bg-fifow-lavender/40 text-fifow-primary transition hover:border-fifow-primary hover:bg-fifow-lavender disabled:opacity-40',
              'flex flex-col items-center justify-center gap-2 font-extrabold',
            )}
          >
            <span className="grid h-12 w-12 place-items-center rounded-full bg-white/80">
              <Plus className="h-6 w-6" />
            </span>
            Ajouter une photo
          </button>
        )
      })}
    </div>
  )
}
