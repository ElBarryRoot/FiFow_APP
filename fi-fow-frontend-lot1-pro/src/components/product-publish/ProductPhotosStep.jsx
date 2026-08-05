import { useState } from 'react'
import PhotoUploadGrid from './PhotoUploadGrid.jsx'
import PublishTipsCard from './PublishTipsCard.jsx'

const acceptedTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'])

export default function ProductPhotosStep({ draft, updateDraft, errors = {} }) {
  const [fileError, setFileError] = useState('')

  function addFiles(fileList) {
    const available = 6 - draft.photos.length
    const selectedFiles = Array.from(fileList || [])
    const files = selectedFiles.slice(0, available)
    const invalidType = files.some((file) => !acceptedTypes.has(file.type))
    const tooLarge = files.some((file) => file.size > 5 * 1024 * 1024)
    if (available === 0 || selectedFiles.length > available) setFileError('Une annonce accepte au maximum 6 photos.')
    else if (invalidType) setFileError('Utilisez uniquement des images JPEG, PNG, WebP, HEIC ou HEIF.')
    else if (tooLarge) setFileError('Chaque image doit peser au maximum 5 Mo.')
    else setFileError('')
    const validPhotos = files.filter((file) => acceptedTypes.has(file.type) && file.size <= 5 * 1024 * 1024).map((file) => ({ id: crypto.randomUUID(), file, preview: URL.createObjectURL(file), uploadedId: null }))
    updateDraft({ photos: [...draft.photos, ...validPhotos] })
  }

  function removePhoto(index) {
    const photo = draft.photos[index]
    if (photo?.uploadedId) return
    if (photo?.preview) URL.revokeObjectURL(photo.preview)
    updateDraft({ photos: draft.photos.filter((_, currentIndex) => currentIndex !== index) })
  }

  return (
    <div className="space-y-6">
      <div><h2 className="text-xl font-extrabold text-fifow-dark sm:text-2xl">Ajoutez vos photos</h2><p className="mt-1 text-sm font-medium text-fifow-secondary">Jusqu’à 6 images de 5 Mo. La première sera la photo principale.</p></div>
      <PhotoUploadGrid photos={draft.photos} onAddFiles={addFiles} onRemovePhoto={removePhoto} />
      {fileError || errors.photos ? <p role="alert" className="text-sm font-bold text-fifow-red">{fileError || errors.photos}</p> : null}
      <PublishTipsCard icon="image" title="Conseils pour de belles photos">Utilisez une bonne lumière, un fond net et montrez les détails importants pour inspirer confiance.</PublishTipsCard>
    </div>
  )
}
