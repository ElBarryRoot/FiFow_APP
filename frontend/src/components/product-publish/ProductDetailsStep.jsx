import { FileText } from 'lucide-react'
import Input from '../ui/Input.jsx'
import Select from '../ui/Select.jsx'
import Textarea from '../ui/Textarea.jsx'
import FormField from '../ui/FormField.jsx'
import { productConditions } from '../../data/publishOptions.js'
import { categories } from '../../data/categories.js'

export default function ProductDetailsStep({ draft, updateDraft, errors = {} }) {
  return (
    <div className="space-y-7">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-lg bg-fifow-lavender text-fifow-primary">
          <FileText className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-xl font-extrabold text-fifow-dark sm:text-2xl">Décrivez votre article</h2>
          <p className="mt-0.5 text-sm font-medium text-fifow-secondary">Commencez par les informations essentielles.</p>
        </div>
      </div>

      <FormField label="Titre de l’annonce" counter={`${draft.title.length}/60`} error={errors.title}>
        <Input
          value={draft.title}
          maxLength={60}
          onChange={(event) => updateDraft({ title: event.target.value })}
          placeholder="Ex. : iPhone 13 Pro Max 256 Go"
          className="h-12"
        />
      </FormField>

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField label="Catégorie" error={errors.category}>
          <Select value={draft.category} onChange={(event) => updateDraft({ category: event.target.value })}>
            <option value="">Choisir une catégorie</option>
            {categories.filter((category) => category.id !== 'plus').map((category) => (
              <option key={category.id} value={category.label}>{category.label}</option>
            ))}
          </Select>
        </FormField>

        <FormField label="État" error={errors.condition}>
          <Select value={draft.condition} onChange={(event) => updateDraft({ condition: event.target.value })}>
            {productConditions.map((condition) => (
              <option key={condition} value={condition}>{condition}</option>
            ))}
          </Select>
        </FormField>
      </div>

      <FormField label="Description" counter={`${draft.description.length}/1000`} error={errors.description}>
        <Textarea
          value={draft.description}
          maxLength={1000}
          onChange={(event) => updateDraft({ description: event.target.value })}
          placeholder="Décrivez l’état, les caractéristiques, les accessoires inclus et les éventuels défauts."
          className="min-h-36"
        />
      </FormField>
    </div>
  )
}
