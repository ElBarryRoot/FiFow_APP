import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowRight, Clock3, Headphones, Plus, Send } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { errorMessage } from '../../api/errors.js'
import { queryKeys } from '../../api/queryKeys.js'
import { supportApi } from '../../api/support.js'
import { EmptyBlock, ErrorBlock, LoadingBlock } from '../../components/commerce/AsyncState.jsx'
import Badge from '../../components/ui/Badge.jsx'
import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'
import Input from '../../components/ui/Input.jsx'
import Select from '../../components/ui/Select.jsx'
import Textarea from '../../components/ui/Textarea.jsx'
import UserPageShell from '../../components/user/UserPageShell.jsx'

const topics = [
  { value: 'ORDER', label: 'Problème avec une commande' },
  { value: 'PAYMENT_REFUND', label: 'Paiement ou remboursement' },
  { value: 'LISTING', label: 'Annonce ou modération' },
  { value: 'ACCOUNT', label: 'Compte ou mot de passe' },
  { value: 'BOOST', label: 'Boost et visibilité' },
  { value: 'SECURITY', label: 'Sécurité ou fraude' },
  { value: 'OTHER', label: 'Autre demande' },
]

const statusTones = { OPEN: 'warning', IN_PROGRESS: 'primary', WAITING_FOR_USER: 'warning', RESOLVED: 'success', CLOSED: 'neutral' }

export default function Support() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState({ topic: 'ORDER', subject: '', reference: '', message: '' })
  const [validationError, setValidationError] = useState('')
  const ticketsQuery = useInfiniteQuery({
    queryKey: queryKeys.supportTickets({}),
    queryFn: ({ pageParam }) => supportApi.list({ cursor: pageParam, limit: 20 }),
    initialPageParam: undefined,
    getNextPageParam: (page) => page.nextCursor || undefined,
  })
  const tickets = useMemo(() => ticketsQuery.data?.pages.flatMap((page) => page.items) || [], [ticketsQuery.data])
  const createMutation = useMutation({
    mutationFn: (input) => supportApi.create(input),
    onSuccess: (ticket) => {
      queryClient.invalidateQueries({ queryKey: ['support', 'tickets'] })
      setForm({ topic: 'ORDER', subject: '', reference: '', message: '' })
      setFormOpen(false)
      navigate(`/support/${ticket.id}`)
    },
  })

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
    setValidationError('')
  }

  function submit(event) {
    event.preventDefault()
    if (form.subject.trim().length < 3 || form.message.trim().length < 5) {
      setValidationError('Ajoutez un objet précis et une description d’au moins 5 caractères.')
      return
    }
    createMutation.mutate({
      topic: form.topic,
      subject: form.subject.trim(),
      ...(form.reference.trim() ? { reference: form.reference.trim() } : {}),
      message: form.message.trim(),
    })
  }

  return (
    <UserPageShell title="Support Fi Fow" eyebrow="Assistance" subtitle="Créez une demande traçable et échangez avec l’équipe sans quitter la plateforme." actions={<Button type="button" size="sm" icon={Plus} onClick={() => setFormOpen((current) => !current)}>{formOpen ? 'Fermer' : 'Nouvelle demande'}</Button>}>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="space-y-4">
          <h2 className="text-xl font-black text-fifow-dark">Mes demandes</h2>
          {ticketsQuery.isLoading ? <LoadingBlock label="Chargement des demandes" rows={3} /> : null}
          {ticketsQuery.isError ? <ErrorBlock title="Support indisponible" message={errorMessage(ticketsQuery.error)} onRetry={ticketsQuery.refetch} /> : null}
          {!ticketsQuery.isLoading && !ticketsQuery.isError && !tickets.length ? <EmptyBlock title="Aucune demande" message="Créez un ticket lorsque vous avez besoin d’un suivi par l’équipe Fi Fow." action={<Button type="button" icon={Plus} onClick={() => setFormOpen(true)}>Créer une demande</Button>} /> : null}
          {tickets.map((ticket) => <TicketCard key={ticket.id} ticket={ticket} />)}
          {ticketsQuery.hasNextPage ? <div className="text-center"><Button type="button" variant="secondary" loading={ticketsQuery.isFetchingNextPage} onClick={() => ticketsQuery.fetchNextPage()}>Charger plus</Button></div> : null}
        </section>

        <aside className="space-y-4 lg:sticky lg:top-24">
          {formOpen ? (
            <Card className="p-5">
              <h2 className="text-lg font-black text-fifow-dark">Nouvelle demande</h2>
              <form className="mt-4 space-y-4" onSubmit={submit}>
                <Field label="Sujet"><Select value={form.topic} onChange={(event) => update('topic', event.target.value)}>{topics.map((topic) => <option key={topic.value} value={topic.value}>{topic.label}</option>)}</Select></Field>
                <Field label="Objet"><Input value={form.subject} maxLength={160} onChange={(event) => update('subject', event.target.value)} placeholder="Résumé de la demande" /></Field>
                <Field label="Référence (optionnel)"><Input value={form.reference} maxLength={120} onChange={(event) => update('reference', event.target.value)} placeholder="Commande, paiement ou annonce" /></Field>
                <Field label="Description"><Textarea value={form.message} maxLength={3000} onChange={(event) => update('message', event.target.value)} className="min-h-32" placeholder="Décrivez les faits et le résultat attendu…" /></Field>
                {validationError ? <p className="text-sm font-bold text-fifow-red" role="alert">{validationError}</p> : null}
                {createMutation.isError ? <p className="text-sm font-bold text-fifow-red" role="alert">{errorMessage(createMutation.error)}</p> : null}
                <Button type="submit" icon={Send} loading={createMutation.isPending} className="w-full">Envoyer au support</Button>
              </form>
            </Card>
          ) : (
            <Card className="p-5">
              <Headphones className="h-9 w-9 text-fifow-primary" />
              <h2 className="mt-3 text-lg font-black text-fifow-dark">Une demande, un suivi</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-fifow-secondary">Ajoutez la référence concernée et ne transmettez jamais de mot de passe ou de code bancaire.</p>
              <p className="mt-4 flex items-center gap-2 text-sm font-black text-fifow-primary"><Clock3 className="h-4 w-4" /> Le statut évolue dans votre espace</p>
            </Card>
          )}
        </aside>
      </div>
    </UserPageShell>
  )
}

function TicketCard({ ticket }) {
  const messageCount = ticket.messageCount ?? ticket.messages?.length ?? 0
  return (
    <Card as={Link} to={`/support/${ticket.id}`} className="block p-4 transition hover:border-violet-200 hover:shadow-soft">
      <div className="flex items-start justify-between gap-4"><div className="min-w-0"><p className="text-xs font-black uppercase text-fifow-muted">{ticket.reference}</p><h3 className="mt-1 truncate text-lg font-black text-fifow-dark">{ticket.subject}</h3><p className="mt-2 text-sm font-semibold text-fifow-secondary">Mis à jour {ticket.time}</p></div><Badge variant={statusTones[ticket.status] || 'neutral'}>{ticket.statusLabel}</Badge></div>
      <div className="mt-3 flex items-center justify-between border-t border-fifow-border pt-3 text-sm font-black text-fifow-primary"><span>{messageCount} message{messageCount > 1 ? 's' : ''}</span><ArrowRight className="h-4 w-4" /></div>
    </Card>
  )
}

function Field({ label, children }) {
  return <label><span className="mb-2 block text-sm font-extrabold text-fifow-dark">{label}</span>{children}</label>
}
