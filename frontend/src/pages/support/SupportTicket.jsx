import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { RefreshCw, Send } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { defaultAvatar } from '../../api/adapters.js'
import { errorMessage } from '../../api/errors.js'
import { queryKeys } from '../../api/queryKeys.js'
import { supportApi } from '../../api/support.js'
import { useAuth } from '../../auth/AuthContext.jsx'
import { ErrorBlock, LoadingBlock } from '../../components/commerce/AsyncState.jsx'
import Badge from '../../components/ui/Badge.jsx'
import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'
import Textarea from '../../components/ui/Textarea.jsx'
import UserPageShell from '../../components/user/UserPageShell.jsx'
import { cn } from '../../lib/utils.js'

const statusTones = { OPEN: 'warning', IN_PROGRESS: 'primary', WAITING_FOR_USER: 'warning', RESOLVED: 'success', CLOSED: 'neutral' }

export default function SupportTicket() {
  const { ticketId } = useParams()
  const auth = useAuth()
  const queryClient = useQueryClient()
  const endRef = useRef(null)
  const [message, setMessage] = useState('')
  const [validationError, setValidationError] = useState('')
  const ticketQuery = useQuery({
    queryKey: queryKeys.supportTicket(ticketId),
    queryFn: () => supportApi.detail(ticketId),
    enabled: Boolean(ticketId),
    refetchInterval: (query) => ['RESOLVED', 'CLOSED'].includes(query.state.data?.status) ? false : 30_000,
  })
  const sendMutation = useMutation({
    mutationFn: (text) => supportApi.sendMessage(ticketId, text),
    onSuccess: (ticket) => {
      queryClient.setQueryData(queryKeys.supportTicket(ticketId), ticket)
      queryClient.invalidateQueries({ queryKey: ['support', 'tickets'] })
      setMessage('')
    },
  })
  const ticket = ticketQuery.data

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [ticket?.messages?.length])

  function submit(event) {
    event.preventDefault()
    const normalized = message.trim()
    if (normalized.length < 2) {
      setValidationError('Votre réponse doit contenir au moins 2 caractères.')
      return
    }
    setValidationError('')
    sendMutation.mutate(normalized)
  }

  return (
    <UserPageShell title={ticket?.subject || 'Demande support'} eyebrow={ticket?.reference || 'Support Fi Fow'} subtitle={ticket ? `Statut : ${ticket.statusLabel}` : 'Chargement de la demande'} backTo="/support" backLabel="Retour au support" actions={ticket ? <Badge variant={statusTones[ticket.status] || 'neutral'}>{ticket.statusLabel}</Badge> : null}>
      {ticketQuery.isLoading ? <LoadingBlock label="Chargement de la conversation support" rows={3} /> : null}
      {ticketQuery.isError ? <ErrorBlock title="Demande introuvable" message={errorMessage(ticketQuery.error)} onRetry={ticketQuery.refetch} /> : null}
      {ticket ? (
        <div className="mx-auto max-w-4xl">
          {ticket.status === 'WAITING_FOR_USER' ? <Card className="mb-4 border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-900">Le support attend votre réponse pour poursuivre le traitement.</Card> : null}
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-fifow-border bg-white p-4"><div><p className="text-xs font-black uppercase text-fifow-muted">Sujet</p><p className="mt-1 font-black text-fifow-dark">{ticket.topic}</p>{ticket.relatedReference ? <p className="mt-1 text-sm font-semibold text-fifow-secondary">Référence : {ticket.relatedReference}</p> : null}</div><Button type="button" variant="ghost" size="sm" icon={RefreshCw} loading={ticketQuery.isFetching} onClick={() => ticketQuery.refetch()} aria-label="Actualiser" /></div>
            <div className="max-h-[58vh] min-h-[360px] space-y-4 overflow-y-auto bg-fifow-bg p-4 sm:p-6" aria-live="polite">
              {ticket.messages.map((item) => <SupportMessage key={item.id} message={item} mine={item.authorId === auth.user.id} />)}
              <div ref={endRef} />
            </div>
            {ticket.status !== 'CLOSED' ? (
              <form onSubmit={submit} className="border-t border-fifow-border bg-white p-4">
                <Textarea value={message} maxLength={3000} onChange={(event) => { setMessage(event.target.value); setValidationError('') }} className="min-h-24" placeholder="Écrire une réponse…" aria-invalid={Boolean(validationError)} />
                <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm font-bold text-fifow-red">{validationError || (sendMutation.isError ? errorMessage(sendMutation.error) : '')}</p><Button type="submit" icon={Send} loading={sendMutation.isPending}>Envoyer</Button></div>
              </form>
            ) : <p className="border-t border-fifow-border bg-white p-4 text-center text-sm font-bold text-fifow-secondary">Cette demande est fermée. Créez une nouvelle demande si le problème persiste.</p>}
          </Card>
        </div>
      ) : null}
    </UserPageShell>
  )
}

function SupportMessage({ message, mine }) {
  const supportAuthor = message.author?.role && message.author.role !== 'USER'
  const name = mine ? 'Vous' : supportAuthor ? 'Support Fi Fow' : message.author?.fullName || 'Fi Fow'
  return <div className={cn('flex items-end gap-2', mine ? 'justify-end' : 'justify-start')}><img src={message.author?.avatarUrl || defaultAvatar} alt="" className={cn('h-8 w-8 rounded-full object-cover', mine && 'order-2')} /><div className={cn('max-w-[82%] rounded-lg px-4 py-3 shadow-sm sm:max-w-[70%]', mine ? 'bg-fifow-primary text-white' : 'border border-fifow-border bg-white text-fifow-dark')}><p className={cn('text-xs font-black', mine ? 'text-white/75' : 'text-fifow-primary')}>{name}</p><p className="mt-1 whitespace-pre-wrap break-words text-sm font-semibold leading-6">{message.message}</p><p className={cn('mt-1 text-[11px] font-bold', mine ? 'text-white/65' : 'text-fifow-muted')}>{message.time}</p></div></div>
}
