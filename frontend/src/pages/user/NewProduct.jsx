import { useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react'
import PublishHeader from '../../components/product-publish/PublishHeader.jsx'
import PublishStepper from '../../components/product-publish/PublishStepper.jsx'
import PublishAssistPanel from '../../components/product-publish/PublishAssistPanel.jsx'
import ProductDetailsStep from '../../components/product-publish/ProductDetailsStep.jsx'
import ProductPhotosStep from '../../components/product-publish/ProductPhotosStep.jsx'
import ProductPriceLocationStep from '../../components/product-publish/ProductPriceLocationStep.jsx'
import ProductPreviewStep from '../../components/product-publish/ProductPreviewStep.jsx'
import ProductSuccessStep from '../../components/product-publish/ProductSuccessStep.jsx'
import Button from '../../components/ui/Button.jsx'
import { defaultDraftProduct, previewDraftProduct } from '../../data/publishOptions.js'
import { cn } from '../../lib/utils.js'

const TOTAL_STEPS = 4

function validateStep(step, draft) {
  const errors = {}

  if (step === 1) {
    if (!draft.title.trim()) errors.title = 'Le titre de l’annonce est obligatoire.'
    if (draft.title.trim().length > 60) errors.title = 'Le titre ne doit pas dépasser 60 caractères.'
    if (!draft.description.trim()) errors.description = 'La description est obligatoire.'
    if (draft.description.trim().length > 1000) errors.description = 'La description ne doit pas dépasser 1000 caractères.'
    if (!draft.category) errors.category = 'Veuillez sélectionner une catégorie.'
    if (!draft.condition) errors.condition = 'Veuillez sélectionner l’état du produit.'
  }

  if (step === 2) {
    if (draft.photos.length === 0) errors.photos = 'Ajoutez au moins une photo de votre article.'
    if (draft.photos.length > 6) errors.photos = 'Vous ne pouvez pas ajouter plus de 6 photos.'
  }

  if (step === 3) {
    if (!draft.price) errors.price = 'Le prix est obligatoire.'
    if (Number(draft.price) <= 0) errors.price = 'Le prix doit être supérieur à 0.'
    if (!draft.commune) errors.commune = 'La commune est obligatoire.'
    if (!draft.quartier) errors.quartier = 'Le quartier est obligatoire.'
    if (!draft.deliveryMode) errors.deliveryMode = 'Choisissez un mode de remise.'
  }

  return errors
}

export default function NewProduct() {
  const initialStep = Math.max(1, Math.min(TOTAL_STEPS, Number(new URLSearchParams(window.location.search).get('step')) || 1))
  const initialSuccess = new URLSearchParams(window.location.search).get('success') === '1'
  const [currentStep, setCurrentStep] = useState(initialStep)
  const [maxStep, setMaxStep] = useState(initialStep)
  const [draft, setDraft] = useState(() => ({ ...(initialStep > 1 || initialSuccess ? previewDraftProduct : defaultDraftProduct) }))
  const [errors, setErrors] = useState({})
  const [published, setPublished] = useState(initialSuccess)
  const [submitting, setSubmitting] = useState(false)

  const progressLabel = useMemo(() => `${currentStep}/${TOTAL_STEPS}`, [currentStep])
  const progressPercent = useMemo(() => (currentStep / TOTAL_STEPS) * 100, [currentStep])

  function updateDraft(partial) {
    setDraft((previous) => ({ ...previous, ...partial }))
    setErrors({})
  }

  function fillDemo() {
    setDraft({ ...previewDraftProduct })
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
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors)
      return
    }
    const nextStep = Math.min(TOTAL_STEPS, currentStep + 1)
    setMaxStep((previous) => Math.max(previous, nextStep))
    setCurrentStep(nextStep)
    setErrors({})
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function goBack() {
    goToStep(currentStep - 1)
  }

  async function publishProduct() {
    const allErrors = {
      ...validateStep(1, draft),
      ...validateStep(2, draft),
      ...validateStep(3, draft),
    }

    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors)
      setCurrentStep(1)
      return
    }

    setSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 500))
    setSubmitting(false)
    setPublished(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (published) {
    return (
      <main className="min-h-screen bg-fifow-bg pb-10">
        <PublishHeader title="Publier une annonce" />
        <section className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <ProductSuccessStep draft={draft} />
        </section>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-fifow-bg pb-10">
      <PublishHeader title="Publier une annonce" />
      <section className="marketplace-container py-5 sm:py-7">
        <div className="mb-5 lg:hidden">
          <div className="mb-3 flex items-center justify-between gap-4">
            <p className="text-sm font-extrabold text-fifow-dark">Étape {progressLabel}</p>
            <button type="button" onClick={fillDemo} className="text-sm font-bold text-fifow-primary hover:underline">
              Utiliser un exemple
            </button>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-violet-100">
            <div className="h-full rounded-full bg-fifow-primary transition-all" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        <div className="mb-5 lg:hidden">
          <PublishStepper currentStep={currentStep} maxStep={maxStep} onStepClick={goToStep} />
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[230px_minmax(0,760px)_280px] xl:justify-between">
          <aside className="sticky top-24 hidden lg:block">
            <PublishStepper currentStep={currentStep} maxStep={maxStep} onStepClick={goToStep} orientation="vertical" />
            <button
              type="button"
              onClick={fillDemo}
              className="mt-6 inline-flex h-10 items-center rounded-lg border border-violet-200 bg-white px-3 text-sm font-bold text-fifow-primary transition hover:bg-fifow-lavender"
            >
              Remplir avec un exemple
            </button>
          </aside>

          <div className="overflow-hidden rounded-lg border border-fifow-border bg-white shadow-card">
            <div className="p-5 sm:p-7 lg:p-8">
              <div className={cn(currentStep === 1 ? 'block' : 'hidden')}>
                <ProductDetailsStep draft={draft} updateDraft={updateDraft} errors={errors} />
              </div>
              <div className={cn(currentStep === 2 ? 'block' : 'hidden')}>
                <ProductPhotosStep draft={draft} updateDraft={updateDraft} errors={errors} />
              </div>
              <div className={cn(currentStep === 3 ? 'block' : 'hidden')}>
                <ProductPriceLocationStep draft={draft} updateDraft={updateDraft} errors={errors} />
              </div>
              <div className={cn(currentStep === 4 ? 'block' : 'hidden')}>
                <ProductPreviewStep draft={draft} onBack={goBack} onPublish={publishProduct} />
              </div>
            </div>

            {currentStep < 4 ? (
              <div className="sticky bottom-0 flex items-center justify-between gap-4 border-t border-fifow-border bg-white/95 px-5 py-4 backdrop-blur sm:px-7 lg:px-8">
                <div className="hidden items-center gap-2 text-xs font-semibold text-fifow-secondary sm:flex">
                  <CheckCircle2 className="h-4 w-4 text-fifow-green" />
                  Modifications enregistrées
                </div>
                <div className="ml-auto flex w-full gap-3 sm:w-auto">
                  {currentStep > 1 ? (
                    <Button type="button" variant="secondary" onClick={goBack} icon={ArrowLeft} className="flex-1 sm:flex-none">
                      Retour
                    </Button>
                  ) : null}
                  <Button type="button" icon={ArrowRight} onClick={goNext} className="flex-1 sm:min-w-40">
                    Continuer
                  </Button>
                </div>
              </div>
            ) : submitting ? (
              <div className="flex h-16 items-center justify-center gap-3 border-t border-fifow-border bg-fifow-primary text-base font-extrabold text-white">
                <Loader2 className="h-5 w-5 animate-spin" /> Publication en cours...
              </div>
            ) : null}
          </div>

          <div className="hidden xl:block">
            <PublishAssistPanel currentStep={currentStep} />
          </div>

          <div className="lg:col-start-2 xl:hidden">
            <div className="flex items-start gap-3 rounded-lg border border-violet-100 bg-fifow-lavender/60 p-4">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-fifow-primary" />
              <p className="text-sm font-semibold leading-6 text-fifow-secondary">
                Une annonce précise, avec des photos nettes et un prix cohérent, inspire davantage confiance.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
