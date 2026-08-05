import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Send, UserCheck } from 'lucide-react'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { adminApi } from '../../api/admin.js'
import { errorMessage } from '../../api/errors.js'
import { useAuth } from '../../auth/AuthContext.jsx'
import AdminConfirmDialog from '../../components/admin/AdminConfirmDialog.jsx'
import AdminPage from '../../components/admin/AdminPage.jsx'
import AdminStatusBadge from '../../components/admin/AdminStatusBadge.jsx'
import { AdminError, AdminLoading } from '../../components/admin/AdminState.jsx'
import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'
import Select from '../../components/ui/Select.jsx'
import Textarea from '../../components/ui/Textarea.jsx'
import { formatAdminDate } from '../../lib/adminFormatters.js'
import { useToast } from '../../lib/toast.jsx'
import { supportStatuses } from './Support.jsx'

export default function AdminSupportDetail() {
  const { id } = useParams()
  const auth = useAuth()
  const showToast = useToast()
  const queryClient = useQueryClient()
  const [message, setMessage] = useState('')
  const [pendingStatus, setPendingStatus] = useState('')
  const query = useQuery({ queryKey: ['admin', 'support', id], queryFn: () => adminApi.support.detail(id) })
  const refresh = () => { query.refetch(); queryClient.invalidateQueries({ queryKey: ['admin', 'support'] }) }
  const assignMutation = useMutation({ mutationFn: () => adminApi.support.assign(id), onSuccess() { refresh(); showToast('Ticket assigné.') }, onError: (error) => showToast(errorMessage(error), { type: 'error' }) })
  const statusMutation = useMutation({ mutationFn: (status) => adminApi.support.updateStatus(id, status), onSuccess() { setPendingStatus(''); refresh(); showToast('Statut mis à jour.') }, onError: (error) => showToast(errorMessage(error), { type: 'error' }) })
  const messageMutation = useMutation({ mutationFn: () => adminApi.support.message(id, message.trim()), onSuccess() { setMessage(''); refresh(); showToast('Réponse envoyée.') }, onError: (error) => showToast(errorMessage(error), { type: 'error' }) })
  const ticket = query.data
  if (query.isLoading) return <AdminLoading rows={8} />
  if (query.isError || !ticket) return <AdminError message="Ce ticket ne peut pas être chargé." onRetry={query.refetch} />
  const assigneeId = ticket.assignedToId || ticket.assignedTo?.id
  const canHandle = !assigneeId || assigneeId === auth.user.id
  const availableStatuses = allowedStatuses(ticket.status)
  return <AdminPage backTo="/admin/support" eyebrow={ticket.reference} title={ticket.subject} description={`${ticket.topic} · ouvert par ${ticket.requester?.fullName || 'un utilisateur'} le ${formatAdminDate(ticket.createdAt)}`} actions={<AdminStatusBadge status={ticket.status} />}>
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="space-y-4">
        <Card className="overflow-hidden">
          <div className="border-b border-fifow-border px-5 py-4"><h3 className="font-black text-fifow-dark">Conversation</h3><p className="mt-1 text-xs font-semibold text-fifow-secondary">Les réponses sont conservées dans le dossier.</p></div>
          <div className="space-y-4 p-4 sm:p-5">{ticket.messages?.length ? ticket.messages.map((entry) => { const isStaff = entry.isStaff || ['MODERATOR', 'ADMIN', 'SUPER_ADMIN'].includes(entry.author?.role); return <article key={entry.id} className={`max-w-[88%] rounded-lg p-4 ${isStaff ? 'ml-auto bg-fifow-lavender' : 'bg-slate-100'}`}><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs font-black text-fifow-dark">{entry.author?.fullName || (isStaff ? 'Équipe FiFow' : 'Utilisateur')}</p><time className="text-xs font-bold text-fifow-muted">{formatAdminDate(entry.createdAt)}</time></div><p className="mt-2 whitespace-pre-wrap text-sm font-semibold leading-6 text-fifow-secondary">{entry.message}</p></article> }) : <p className="py-8 text-center text-sm font-semibold text-fifow-secondary">Aucun message.</p>}</div>
        </Card>
        {canHandle && !['RESOLVED', 'CLOSED'].includes(ticket.status) ? <Card className="p-4 sm:p-5"><label><span className="text-sm font-extrabold text-fifow-dark">Réponse au demandeur</span><Textarea value={message} onChange={(event) => setMessage(event.target.value)} maxLength={3000} className="mt-2 min-h-32" placeholder="Rédigez une réponse claire et exploitable." /></label><div className="mt-3 flex justify-end"><Button type="button" icon={Send} loading={messageMutation.isPending} disabled={message.trim().length < 2} onClick={() => messageMutation.mutate()}>Envoyer</Button></div></Card> : null}
      </section>
      <aside className="space-y-4 xl:sticky xl:top-24">
        <Card className="p-4"><h3 className="font-black text-fifow-dark">Traitement</h3><dl className="mt-4 space-y-3"><Detail label="Priorité" value={ticket.priority} /><Detail label="Référence liée" value={ticket.relatedReference} /><Detail label="Assigné à" value={ticket.assignedTo?.fullName || 'Personne'} /></dl>{!assigneeId ? <Button type="button" variant="secondary" icon={UserCheck} className="mt-4 w-full" loading={assignMutation.isPending} onClick={() => assignMutation.mutate()}>Prendre en charge</Button> : null}{!canHandle ? <p className="mt-4 rounded-lg bg-amber-50 p-3 text-xs font-bold leading-5 text-amber-800">Ce ticket est traité par {ticket.assignedTo?.fullName || 'un autre agent'}.</p> : null}</Card>
        {canHandle && availableStatuses.length > 1 ? <Card className="p-4"><label><span className="text-sm font-extrabold text-fifow-dark">Statut du ticket</span><Select value={pendingStatus || ticket.status} className="mt-2 h-11" disabled={statusMutation.isPending} onChange={(event) => setPendingStatus(event.target.value)}>{availableStatuses.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</Select></label></Card> : null}
      </aside>
    </div>
    <AdminConfirmDialog open={Boolean(pendingStatus && pendingStatus !== ticket.status)} title="Modifier le statut du ticket" description={`Le ticket passera de ${supportStatusLabel(ticket.status)} à ${supportStatusLabel(pendingStatus)}.`} confirmLabel="Mettre à jour" tone="primary" loading={statusMutation.isPending} onClose={() => setPendingStatus('')} onConfirm={() => statusMutation.mutate(pendingStatus)} />
  </AdminPage>
}

function Detail({ label, value }) { return <div><dt className="text-xs font-black uppercase text-fifow-muted">{label}</dt><dd className="mt-1 break-words text-sm font-bold text-fifow-dark">{value || '—'}</dd></div> }
function supportStatusLabel(value) { return supportStatuses.find((option) => option.value === value)?.label || value }
function allowedStatuses(current) {
  const transitions = {
    OPEN: ['IN_PROGRESS', 'CLOSED'],
    IN_PROGRESS: ['WAITING_FOR_USER', 'RESOLVED', 'CLOSED'],
    WAITING_FOR_USER: ['IN_PROGRESS', 'RESOLVED', 'CLOSED'],
    RESOLVED: ['IN_PROGRESS', 'CLOSED'],
    CLOSED: [],
  }
  const values = new Set([current, ...(transitions[current] || [])])
  return supportStatuses.filter((option) => values.has(option.value))
}
