import { FileText } from 'lucide-react'
import Input from '../ui/Input.jsx'
import Select from '../ui/Select.jsx'
import Textarea from '../ui/Textarea.jsx'
import FormField from '../ui/FormField.jsx'
import { productConditions } from '../../data/publishOptions.js'

export default function ProductDetailsStep({ draft, updateDraft, categories = [], categoriesLoading = false, errors = {} }) {
  const selectedCategory = categories.find((category) => category.id === draft.categoryId)
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
      <FormField label="Description" counter={`${draft.description.length}/10000`} error={errors.description}><Textarea value={draft.description} maxLength={10000} onChange={(event) => updateDraft({ description: event.target.value })} placeholder="Décrivez l’état, les caractéristiques, les accessoires inclus et les éventuels défauts." className="min-h-40" /></FormField>
    </div>
  )
}

