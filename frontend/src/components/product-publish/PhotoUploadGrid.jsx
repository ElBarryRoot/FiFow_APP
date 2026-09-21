import { ImagePlus, X } from 'lucide-react'

export default function PhotoUploadGrid({ photos, onAddFiles, onRemovePhoto }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {photos.map((photo, index) => (
        <div key={photo.id} className="relative aspect-square overflow-hidden rounded-lg bg-slate-100">
          <img src={photo.preview} alt={`Produit ${index + 1}`} className="h-full w-full object-cover" />
          <button type="button" onClick={() => onRemovePhoto(index)} className="absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-full bg-white text-fifow-primary shadow-card transition hover:bg-fifow-lavender" aria-label="Supprimer la photo"><X className="h-5 w-5" /></button>
          {index === 0 ? <span className="absolute bottom-2 left-2 rounded-md bg-fifow-primary px-2 py-1 text-xs font-extrabold text-white">Photo principale</span> : null}
          {photo.uploadedId ? <span className="absolute bottom-2 right-2 rounded-md bg-emerald-600 px-2 py-1 text-xs font-bold text-white">Envoyée</span> : null}
        </div>
      ))}
      {photos.length < 6 ? (
        <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-violet-200 bg-fifow-lavender/40 font-extrabold text-fifow-primary transition hover:border-fifow-primary hover:bg-fifow-lavender">
          <input type="file" multiple accept="image/jpeg,image/png,image/webp,image/heic,image/heif" onChange={(event) => { onAddFiles(event.target.files); event.target.value = '' }} className="sr-only" />
          <span className="grid h-12 w-12 place-items-center rounded-full bg-white/80"><ImagePlus className="h-6 w-6" /></span>
          Ajouter des photos
        </label>
      ) : null}
    </div>
  )
}

