import { samplePublishPhotos } from '../../data/publishOptions.js'
import PhotoUploadGrid from './PhotoUploadGrid.jsx'
import PublishTipsCard from './PublishTipsCard.jsx'

export default function ProductPhotosStep({ draft, updateDraft, errors = {} }) {
  function addSamplePhoto() {
    if (draft.photos.length >= 6) return
    const nextPhoto = samplePublishPhotos[draft.photos.length % samplePublishPhotos.length]
    updateDraft({ photos: [...draft.photos, nextPhoto] })
  }

  function removePhoto(index) {
    updateDraft({ photos: draft.photos.filter((_, currentIndex) => currentIndex !== index) })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-fifow-dark sm:text-2xl">Ajoutez vos photos</h2>
        <p className="mt-1 text-sm font-medium text-fifow-secondary">Jusqu’à 6 photos. La première sera la photo principale.</p>
      </div>
      <PhotoUploadGrid photos={draft.photos} onAddSample={addSamplePhoto} onRemovePhoto={removePhoto} />
      {errors.photos ? <p className="text-sm font-bold text-fifow-red">{errors.photos}</p> : null}
      <PublishTipsCard icon="image" title="Conseils pour de belles photos">
        Utilisez une bonne lumière, un fond net et montrez les détails importants pour inspirer confiance.
      </PublishTipsCard>
    </div>
  )
}
