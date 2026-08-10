import { useMemo, useState } from 'react'
import { FileText, Sparkles } from 'lucide-react'
import Input from '../ui/Input.jsx'
import Select from '../ui/Select.jsx'
import Textarea from '../ui/Textarea.jsx'
import FormField from '../ui/FormField.jsx'
import Button from '../ui/Button.jsx'
import { productConditions } from '../../data/publishOptions.js'
import { buildLocalDescriptionDraft } from './descriptionAssistant.js'

export default function ProductDetailsStep({ draft, updateDraft, categories = [], categoriesLoading = false, errors = {} }) {
  const selectedCategory = categories.find((category) => category.id === draft.categoryId)
  const selectedSubcategory = selectedCategory?.children?.find((subcategory) => subcategory.id === draft.subcategoryId)
  const selectedCondition = productConditions.find((condition) => condition.value === draft.condition)
  const [descriptionAssisted, setDescriptionAssisted] = useState(false)
  const suggestedDescription = useMemo(() => buildLocalDescriptionDraft({
    title: draft.title,
    categoryName: selectedCategory?.name,
    subcategoryName: selectedSubcategory?.name,
    conditionLabel: selectedCondition?.label,
  }), [draft.title, selectedCategory?.name, selectedCondition?.label, selectedSubcategory?.name])

  function applySuggestedDescription() {
    updateDraft({ description: suggestedDescription })
    setDescriptionAssisted(true)
  }

  return (
    <div className="space-y-7">
      <div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-lg bg-fifow-lavender text-fifow-primary"><FileText className="h-5 w-5" /></span><div><h2 className="text-xl font-extrabold text-fifow-dark sm:text-2xl">Décrivez votre article</h2><p className="mt-0.5 text-sm font-medium text-fifow-secondary">Commencez par les informations essentielles.</p></div></div>
      <FormField label="Titre de l’annonce" counter={`${draft.title.length}/120`} error={errors.title}><Input value={draft.title} maxLength={120} onChange={(event) => updateDraft({ title: event.target.value })} placeholder="Ex. : iPhone 13 Pro Max 256 Go" className="h-12" /></FormField>
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField label="Catégorie" error={errors.categoryId}>
          <Select disabled={categoriesLoading} value={draft.categoryId} onChange={(event) => updateDraft({ categoryId: event.target.value, subcategoryId: '' })}><option value="">{categoriesLoading ? 'Chargement…' : 'Choisir une catégorie'}</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</Select>
        </FormField>
        <FormField label="Sous-catégorie" error={errors.subcategoryId}>
          <Select disabled={!selectedCategory} value={draft.subcategoryId} onChange={(event) => updateDraft({ subcategoryId: event.target.value })}><option value="">Choisir une sous-catégorie</option>{selectedCategory?.children.map((subcategory) => <option key={subcategory.id} value={subcategory.id}>{subcategory.name}</option>)}</Select>
        </FormField>
      </div>
      <FormField label="État" error={errors.condition}><Select value={draft.condition} onChange={(event) => updateDraft({ condition: event.target.value })}>{productConditions.map((condition) => <option key={condition.value} value={condition.value}>{condition.label}</option>)}</Select></FormField>
      <section className="rounded-lg border border-violet-100 bg-violet-50/60 p-4" aria-labelledby="description-assistant-title">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white text-fifow-primary shadow-sm"><Sparkles className="h-5 w-5" /></span>
            <div>
              <h3 id="description-assistant-title" className="font-extrabold text-fifow-dark">Assistant de description</h3>
              <p className="mt-1 text-sm font-medium leading-5 text-fifow-secondary">Une base locale à relire et compléter avant publication.</p>
            </div>
          </div>
          <Button type="button" variant="secondary" size="sm" icon={Sparkles} disabled={!draft.title.trim()} onClick={applySuggestedDescription} className="shrink-0">
            {draft.description.trim() ? 'Remplacer par la suggestion' : 'Créer une suggestion'}
          </Button>
        </div>
        {descriptionAssisted ? <p role="status" aria-live="polite" className="mt-3 text-sm font-bold text-fifow-primary">Suggestion ajoutée. Vous pouvez la modifier librement.</p> : null}
      </section>
      <FormField label="Description" counter={`${draft.description.length}/10000`} error={errors.description}><Textarea value={draft.description} maxLength={10000} onChange={(event) => updateDraft({ description: event.target.value })} placeholder="Décrivez l’état, les caractéristiques, les accessoires inclus et les éventuels défauts." className="min-h-40" /></FormField>
    </div>
  )
}
