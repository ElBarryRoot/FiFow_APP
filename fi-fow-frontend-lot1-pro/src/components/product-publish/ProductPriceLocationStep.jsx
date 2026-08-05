import Select from '../ui/Select.jsx'
import Switch from '../ui/Switch.jsx'
import FormField from '../ui/FormField.jsx'
import { communes, deliveryOptions, quartiersByCommune } from '../../data/publishOptions.js'
import DeliveryOptionCard from './DeliveryOptionCard.jsx'

export default function ProductPriceLocationStep({ draft, updateDraft, errors = {} }) {
  const quartiers = quartiersByCommune[draft.commune] || []
  function updateCommune(commune) {
    updateDraft({ commune, quartier: quartiersByCommune[commune]?.[0] || '' })
  }
  function toggleHandover(mode) {
    const selected = draft.handoverModes.includes(mode)
    updateDraft({ handoverModes: selected ? draft.handoverModes.filter((item) => item !== mode) : [...draft.handoverModes, mode] })
  }

  return (
    <div>
      <div><h2 className="text-xl font-extrabold text-fifow-dark sm:text-2xl">Prix et remise</h2><p className="mt-1 text-sm font-medium text-fifow-secondary">Définissez le prix et les modes de remise réellement disponibles.</p></div>
      <div className="mt-7 grid items-end gap-5 sm:grid-cols-[minmax(0,1fr)_auto]">
        <FormField label="Prix" hint="Montant affiché en francs guinéens." error={errors.price}><div className="flex h-14 overflow-hidden rounded-lg border border-fifow-border bg-white transition focus-within:border-fifow-primary focus-within:ring-4 focus-within:ring-violet-100"><input value={draft.price} onChange={(event) => updateDraft({ price: event.target.value.replace(/[^0-9]/g, '').slice(0, 15) })} placeholder="Ex. 500 000" inputMode="numeric" className="min-w-0 flex-1 px-4 text-base font-bold text-fifow-dark outline-none placeholder:text-fifow-muted" /><span className="grid w-20 place-items-center border-l border-fifow-border bg-slate-50 text-sm font-extrabold text-fifow-dark">GNF</span></div></FormField>
        <div className="flex h-14 min-w-48 items-center justify-between gap-5 rounded-lg border border-fifow-border px-4"><div><p className="text-sm font-extrabold text-fifow-dark">Prix négociable</p><p className="mt-0.5 text-xs font-medium text-fifow-secondary">Autoriser les offres</p></div><Switch checked={draft.negotiable} onChange={(value) => updateDraft({ negotiable: value })} label="Prix négociable" /></div>
      </div>
      <section className="mt-8 border-t border-fifow-border pt-7"><div><h3 className="text-base font-extrabold text-fifow-dark">Localisation</h3><p className="mt-1 text-sm font-medium text-fifow-secondary">Seule la zone générale sera visible.</p></div><div className="mt-5 grid gap-5 sm:grid-cols-2"><FormField label="Commune" error={errors.commune}><Select value={draft.commune} onChange={(event) => updateCommune(event.target.value)}>{communes.map((commune) => <option key={commune}>{commune}</option>)}</Select></FormField><FormField label="Quartier" error={errors.quartier}><Select value={draft.quartier} onChange={(event) => updateDraft({ quartier: event.target.value })}>{quartiers.map((quartier) => <option key={quartier}>{quartier}</option>)}</Select></FormField></div></section>
      <section className="mt-8 border-t border-fifow-border pt-7"><div><h3 className="text-base font-extrabold text-fifow-dark">Modes de remise</h3><p className="mt-1 text-sm font-medium text-fifow-secondary">Vous pouvez en sélectionner plusieurs.</p></div><div className="mt-5 grid gap-3 sm:grid-cols-3">{deliveryOptions.map((option) => <DeliveryOptionCard key={option.id} option={option} active={draft.handoverModes.includes(option.id)} onClick={toggleHandover} />)}</div>{errors.handoverModes ? <p className="mt-3 text-sm font-bold text-fifow-red">{errors.handoverModes}</p> : null}</section>
    </div>
  )
}
