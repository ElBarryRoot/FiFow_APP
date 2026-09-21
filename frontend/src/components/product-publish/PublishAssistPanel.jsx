import { Eye, Image, Lightbulb, ShieldCheck, Tag } from 'lucide-react'

const guidance = {
  1: {
    icon: Lightbulb,
    title: 'Une annonce facile à trouver',
    text: 'Un titre précis et une description honnête donnent de meilleurs résultats.',
    items: ['Indiquez la marque et le modèle', 'Mentionnez les défauts visibles', 'Évitez les majuscules inutiles'],
  },
  2: {
    icon: Image,
    title: 'Des photos qui rassurent',
    text: 'La première photo sera visible dans les résultats de recherche.',
    items: ['Cadrez l’article en entier', 'Ajoutez les détails et défauts', 'Utilisez une lumière naturelle'],
  },
  3: {
    icon: Tag,
    title: 'Un prix cohérent',
    text: 'Comparez des articles similaires et précisez clairement le mode de remise.',
    items: ['Gardez une marge si le prix est négociable', 'Choisissez un lieu de remise précis', 'Restez dans la messagerie Fi Fow'],
  },
  4: {
    icon: Eye,
    title: 'Dernière vérification',
    text: 'Voici exactement ce que les acheteurs verront après publication.',
    items: ['Relisez le titre et le prix', 'Vérifiez la photo principale', 'Confirmez la localisation'],
  },
}

export default function PublishAssistPanel({ currentStep }) {
  const item = guidance[currentStep] || guidance[1]
  const Icon = item.icon

  return (
    <aside className="sticky top-24 space-y-5">
      <div className="rounded-lg border border-fifow-border bg-white p-5 shadow-card">
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-fifow-lavender text-fifow-primary">
          <Icon className="h-5 w-5" />
        </span>
        <h2 className="mt-4 text-base font-extrabold text-fifow-dark">{item.title}</h2>
        <p className="mt-2 text-sm font-medium leading-6 text-fifow-secondary">{item.text}</p>
        <ul className="mt-4 space-y-3">
          {item.items.map((tip) => (
            <li key={tip} className="flex gap-2.5 text-sm font-semibold leading-5 text-fifow-secondary">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-fifow-primary" />
              {tip}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex gap-3 rounded-lg border border-emerald-100 bg-fifow-mint p-4">
        <ShieldCheck className="h-5 w-5 shrink-0 text-fifow-green" />
        <div>
          <p className="text-sm font-extrabold text-fifow-dark">Publication gratuite</p>
          <p className="mt-1 text-xs font-medium leading-5 text-fifow-secondary">
            Vous gardez le contrôle de l’annonce et pouvez la modifier après publication.
          </p>
        </div>
      </div>
    </aside>
  )
}
