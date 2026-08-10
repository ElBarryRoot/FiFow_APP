import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react'
import { catalogueApi } from '../../api/catalogue.js'
import { errorMessage, isApiError } from '../../api/errors.js'
import { queryKeys } from '../../api/queryKeys.js'
import { useAuth } from '../../auth/AuthContext.jsx'
import PublishHeader from '../../components/product-publish/PublishHeader.jsx'
import PublishStepper from '../../components/product-publish/PublishStepper.jsx'
import PublishAssistPanel from '../../components/product-publish/PublishAssistPanel.jsx'
import ProductDetailsStep from '../../components/product-publish/ProductDetailsStep.jsx'
import ProductPhotosStep from '../../components/product-publish/ProductPhotosStep.jsx'
import ProductPriceLocationStep from '../../components/product-publish/ProductPriceLocationStep.jsx'
import ProductPreviewStep from '../../components/product-publish/ProductPreviewStep.jsx'
import ProductSuccessStep from '../../components/product-publish/ProductSuccessStep.jsx'
import Button from '../../components/ui/Button.jsx'
import { defaultDraftProduct } from '../../data/publishOptions.js'
import { cn } from '../../lib/utils.js'

const TOTAL_STEPS = 4

function validateStep(step, draft) {
  const errors = {}
  if (step === 1) {
    if (draft.title.trim().length < 5) errors.title = 'Le titre doit contenir au moins 5 caractères.'
    if (draft.title.trim().length > 120) errors.title = 'Le titre ne doit pas dépasser 120 caractères.'
    if (draft.description.trim().length < 20) errors.description = 'Décrivez le produit en au moins 20 caractères.'
    if (draft.description.trim().length > 10000) errors.description = 'La description est trop longue.'
    if (!draft.categoryId) errors.categoryId = 'Sélectionnez une catégorie.'
    if (!draft.subcategoryId) errors.subcategoryId = 'Sélectionnez une sous-catégorie.'
    if (!draft.condition) errors.condition = 'Sélectionnez l’état du produit.'
  }
  if (step === 2) {
    if (!draft.photos.length) errors.photos = 'Ajoutez au moins une photo réelle de votre article.'
    if (draft.photos.length > 6) errors.photos = 'Une annonce accepte au maximum 6 photos.'
  }
  if (step === 3) {
    if (!/^[1-9][0-9]{2,14}$/.test(draft.price)) errors.price = 'Indiquez un prix entier d’au moins 100 GNF.'
    if (draft.commune.trim().length < 2) errors.commune = 'La commune est obligatoire.'
    if (draft.quartier.trim().length < 2) errors.quartier = 'Le quartier est obligatoire.'
    if (!draft.handoverModes.length) errors.handoverModes = 'Sélectionnez au moins un mode de remise.'
  }
  return errors
}

export default function NewProduct() {
  const auth = useAuth()
  const queryClient = useQueryClient()
  const categoriesQuery = useQuery({ queryKey: queryKeys.categories, queryFn: catalogueApi.categories, staleTime: 30 * 60_000 })
  const [currentStep, setCurrentStep] = useState(1)
  const [maxStep, setMaxStep] = useState(1)
  const [draft, setDraft] = useState(defaultDraftProduct)
  const [errors, setErrors] = useState({})
  const [publishedProduct, setPublishedProduct] = useState(null)
  const [serverProductId, setServerProductId] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')
  const progressLabel = useMemo(() => `${currentStep}/${TOTAL_STEPS}`, [currentStep])
  const progressPercent = useMemo(() => (currentStep / TOTAL_STEPS) * 100, [currentStep])

  function updateDraft(partial) {
    setDraft((previous) => ({ ...previous, ...partial }))
    setErrors({})
  }
  function goToStep(step) {
    const nextStep = Math.max(1, Math.min(TOTAL_STEPS, step))
    if (nextStep > maxStep) return
    setCurrentStep(nextStep)
    setErrors({})
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  function goNext() {
    const stepErrors = validateStep(currentStep, draft)
    if (Object.keys(stepErrors).length) return setErrors(stepErrors)
    const nextStep = Math.min(TOTAL_STEPS, currentStep + 1)
    setMaxStep((previous) => Math.max(previous, nextStep))
    setCurrentStep(nextStep)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function publishProduct() {
    const allErrors = { ...validateStep(1, draft), ...validateStep(2, draft), ...validateStep(3, draft) }
    if (Object.keys(allErrors).length) {
      setErrors(allErrors)
      const detailsInvalid = allErrors.title || allErrors.description || allErrors.categoryId || allErrors.subcategoryId || allErrors.condition
      setCurrentStep(detailsInvalid ? 1 : allErrors.photos ? 2 : 3)
      return
    }
    if (process.env.NODE_ENV !== 'production' && auth.requiresEmailVerification) {
      console.info('Local publish override: email verification is skipped in development mode.')
    }
    setSubmitting(true)
    setErrors({})
    try {
      const productInput = {
        title: draft.title.trim(), description: draft.description.trim(), price: draft.price,
        condition: draft.condition, isNegotiable: draft.negotiable,
        categoryId: draft.categoryId, subcategoryId: draft.subcategoryId,
        commune: draft.commune.trim(), quartier: draft.quartier.trim(), handoverModes: draft.handoverModes,
      }
      let productId = serverProductId
      if (!productId) {
        setUploadProgress('Création du brouillon…')
        const created = await catalogueApi.create(productInput)
        productId = created.id
        setServerProductId(productId)
      } else {
        setUploadProgress('Mise à jour du brouillon…')
        await catalogueApi.update(productId, productInput)
      }
      const uploadedIds = []
      for (let index = 0; index < draft.photos.length; index += 1) {
        const photo = draft.photos[index]
        if (photo.uploadedId) {
          uploadedIds.push(photo.uploadedId)
          continue
        }
        setUploadProgress(`Envoi de la photo ${index + 1}/${draft.photos.length}…`)
        const uploaded = await catalogueApi.addImage(productId, photo.file)
        uploadedIds.push(uploaded.id)
        setDraft((current) => ({ ...current, photos: current.photos.map((item) => item.id === photo.id ? { ...item, uploadedId: uploaded.id } : item) }))
      }
      if (uploadedIds.length > 1) await catalogueApi.reorderImages(productId, uploadedIds)
      await catalogueApi.setMainImage(productId, uploadedIds[0])
      setUploadProgress('Publication de l’annonce…')
      const published = await catalogueApi.publish(productId)
      setPublishedProduct(published)
      queryClient.invalidateQueries({ queryKey: queryKeys.myProducts })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (requestError) {
      const fieldErrors = isApiError(requestError) ? requestError.fieldErrors() : {}
      setErrors({ ...fieldErrors, submit: errorMessage(requestError, 'La publication n’a pas pu aboutir. Votre brouillon est conservé.') })
    } finally {
      setSubmitting(false)
      setUploadProgress('')
    }
  }

  if (publishedProduct) return <main className="min-h-screen bg-fifow-bg pb-10"><PublishHeader title="Annonce créée" /><section className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8"><ProductSuccessStep product={publishedProduct} /></section></main>

  return (
    <main className="min-h-screen bg-fifow-bg pb-10">
      <PublishHeader />
      <section className="marketplace-container py-5 sm:py-7">
        <div className="mb-5 lg:hidden"><div className="mb-3 flex items-center justify-between gap-4"><p className="text-sm font-extrabold text-fifow-dark">Étape {progressLabel}</p></div><div className="h-1.5 overflow-hidden rounded-full bg-violet-100"><div className="h-full rounded-full bg-fifow-primary transition-all" style={{ width: `${progressPercent}%` }} /></div></div>
        <div className="mb-5 lg:hidden"><PublishStepper currentStep={currentStep} maxStep={maxStep} onStepClick={goToStep} /></div>
        <div className="grid items-start gap-6 lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[230px_minmax(0,760px)_280px] xl:justify-between">
          <aside className="sticky top-24 hidden lg:block"><PublishStepper currentStep={currentStep} maxStep={maxStep} onStepClick={goToStep} orientation="vertical" /></aside>
          <div className="overflow-hidden rounded-lg border border-fifow-border bg-white shadow-card">
            <div className="p-5 sm:p-7 lg:p-8">
              <div className={cn(currentStep === 1 ? 'block' : 'hidden')}><ProductDetailsStep draft={draft} updateDraft={updateDraft} categories={categoriesQuery.data || []} categoriesLoading={categoriesQuery.isLoading} errors={errors} /></div>
              <div className={cn(currentStep === 2 ? 'block' : 'hidden')}><ProductPhotosStep draft={draft} updateDraft={updateDraft} errors={errors} /></div>
              <div className={cn(currentStep === 3 ? 'block' : 'hidden')}><ProductPriceLocationStep draft={draft} updateDraft={updateDraft} errors={errors} /></div>
              <div className={cn(currentStep === 4 ? 'block' : 'hidden')}><ProductPreviewStep draft={draft} onBack={() => goToStep(3)} onPublish={publishProduct} submitting={submitting} /></div>
              {errors.submit ? <p role="alert" className="mt-5 rounded-lg bg-red-50 p-4 text-sm font-bold text-fifow-red">{errors.submit}</p> : null}
              {uploadProgress ? <p role="status" className="mt-4 text-center text-sm font-bold text-fifow-primary">{uploadProgress}</p> : null}
            </div>
            {currentStep < 4 ? <div className="sticky bottom-0 flex items-center justify-between gap-4 border-t border-fifow-border bg-white/95 px-5 py-4 backdrop-blur sm:px-7 lg:px-8"><div className="hidden items-center gap-2 text-xs font-semibold text-fifow-secondary sm:flex"><CheckCircle2 className="h-4 w-4 text-fifow-green" /> Vos données restent dans ce formulaire jusqu’à la création du brouillon.</div><div className="ml-auto flex w-full gap-3 sm:w-auto">{currentStep > 1 ? <Button type="button" variant="secondary" onClick={() => goToStep(currentStep - 1)} icon={ArrowLeft} className="flex-1 sm:flex-none">Retour</Button> : null}<Button type="button" icon={ArrowRight} onClick={goNext} className="flex-1 sm:min-w-40">Continuer</Button></div></div> : null}
          </div>
          <div className="hidden xl:block"><PublishAssistPanel currentStep={currentStep} /></div>
        </div>
      </section>
    </main>
  )
}
