import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, Gavel, UserCheck } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { adminApi } from '../../api/admin.js'
import { errorMessage } from '../../api/errors.js'
import AdminConfirmDialog from '../../components/admin/AdminConfirmDialog.jsx'
import AdminPage from '../../components/admin/AdminPage.jsx'
import AdminStatusBadge from '../../components/admin/AdminStatusBadge.jsx'
import { AdminError, AdminLoading } from '../../components/admin/AdminState.jsx'
import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'
import Select from '../../components/ui/Select.jsx'
import Textarea from '../../components/ui/Textarea.jsx'
import { formatAdminDate, formatAdminMoney, shortId } from '../../lib/adminFormatters.js'
import { useToast } from '../../lib/toast.jsx'
import { reasonLabel, targetLabel } from './Reports.jsx'

const actionsByTarget = {
  PRODUCT: [
    ['HIDE_PRODUCT', 'Masquer l’annonce'],
    ['ARCHIVE_PRODUCT', 'Archiver l’annonce'],
    ['RESTORE_PRODUCT', 'Restaurer l’annonce'],
  ],
  USER: [
    ['WARNING', 'Avertir'],
    ['SUSPEND_USER', 'Suspendre'],
    ['BAN_USER', 'Bannir'],
    ['RESTORE_USER', 'Restaurer le compte'],
    ['REMOVE_VERIFIED_BADGE', 'Retirer le badge vendeur'],
  ],
  REVIEW: [['HIDE_REVIEW', 'Masquer l’avis'], ['RESTORE_REVIEW', 'Restaurer l’avis']],
  CONVERSATION: [['BLOCK_CONVERSATION', 'Bloquer la conversation'], ['UNBLOCK_CONVERSATION', 'Débloquer la conversation']],
}

export default function AdminReportDetail() {
  const { id } = useParams()
  const queryClient = useQueryClient()
  const showToast = useToast()
  const [decision, setDecision] = useState('')
  const [resolution, setResolution] = useState('RESOLVED')
  const [moderationAction, setModerationAction] = useState('')
  const [dialog, setDialog] = useState(null)
  const reportQuery = useQuery({ queryKey: ['admin', 'reports', id], queryFn: () => adminApi.reports.detail(id) })
  const report = reportQuery.data
  const availableActions = useMemo(() => actionsByTarget[report?.targetType] || [], [report?.targetType])

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] })
    queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] })
  }
  const assignMutation = useMutation({
    mutationFn: () => adminApi.reports.assign(id),
    onSuccess() { refresh(); showToast('Signalement assigné.') },
    onError: (error) => showToast(errorMessage(error), { type: 'error' }),
  })
  const resolveMutation = useMutation({
    mutationFn: () => adminApi.reports.resolve(id, { status: resolution, decision: decision.trim() }),
    onSuccess() { refresh(); showToast('Décision enregistrée.'); setDialog(null) },
    onError: (error) => showToast(errorMessage(error), { type: 'error' }),
  })
  const moderationMutation = useMutation({
    mutationFn: (reason) => adminApi.moderation.apply({ targetType: report.targetType, targetId: report.targetId, action: moderationAction, reason }),
    onSuccess() { refresh(); reportQuery.refetch(); showToast('Action de modération appliquée.'); setDialog(null) },
    onError: (error) => showToast(errorMessage(error), { type: 'error' }),
  })

  if (reportQuery.isLoading) return <AdminLoading rows={7} />
  if (reportQuery.isError || !report) return <AdminError onRetry={reportQuery.refetch} message="Ce signalement ne peut pas être chargé." />

  return (
    <AdminPage
      backTo="/admin/reports"
      eyebrow={`${targetLabel(report.targetType)} · ${shortId(report.id)}`}
      title={reasonLabel(report.reason)}
      description={`Reçu le ${formatAdminDate(report.createdAt)} par ${report.reporter?.fullName || 'un utilisateur'}.`}
      actions={<AdminStatusBadge status={report.status} />}
    >
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-5">
          <Card className="p-5">
            <h3 className="text-lg font-black text-fifow-dark">Déclaration</h3>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <Detail label="Priorité" value={report.priority} />
              <Detail label="Cible" value={`${targetLabel(report.targetType)} · ${shortId(report.targetId)}`} />
              <Detail label="Déclarant" value={`${report.reporter?.fullName || 'Inconnu'} · ${report.reporter?.email || ''}`} />
              <Detail label="Assigné à" value={report.assignedTo?.fullName || 'Non assigné'} />
            </dl>
            <div className="mt-5 border-t border-fifow-border pt-4">
              <p className="text-xs font-black uppercase text-fifow-muted">Description</p>
              <p className="mt-2 whitespace-pre-wrap text-sm font-semibold leading-6 text-fifow-secondary">{report.description || 'Aucune précision fournie.'}</p>
            </div>
          </Card>
          <TargetPreview type={report.targetType} target={report.target} />
        </div>

        <aside className="space-y-4 xl:sticky xl:top-24">
          {report.status === 'OPEN' ? (
            <Button type="button" className="w-full" icon={UserCheck} loading={assignMutation.isPending} onClick={() => assignMutation.mutate()}>Prendre en charge</Button>
          ) : null}

          {availableActions.length ? (
            <Card className="p-4">
              <h3 className="font-black text-fifow-dark">Action de modération</h3>
              <p className="mt-1 text-xs font-semibold leading-5 text-fifow-secondary">L’action sera journalisée avec votre identité et son motif.</p>
              <Select className="mt-4 h-11" value={moderationAction} onChange={(event) => setModerationAction(event.target.value)}>
                <option value="">Choisir une action</option>
                {availableActions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </Select>
              <Button type="button" variant="secondary" className="mt-3 w-full" icon={Gavel} disabled={!moderationAction} onClick={() => setDialog('moderation')}>Appliquer</Button>
            </Card>
          ) : null}

          {!['RESOLVED', 'REJECTED'].includes(report.status) ? (
            <Card className="p-4">
              <h3 className="font-black text-fifow-dark">Clôturer le dossier</h3>
              <Select className="mt-4 h-11" value={resolution} onChange={(event) => setResolution(event.target.value)}>
                <option value="RESOLVED">Signalement fondé et résolu</option>
                <option value="REJECTED">Signalement rejeté</option>
              </Select>
              <label className="mt-3 block">
                <span className="text-sm font-extrabold text-fifow-dark">Décision</span>
                <Textarea value={decision} onChange={(event) => setDecision(event.target.value)} maxLength={1000} className="mt-2 min-h-28" placeholder="Expliquez la décision de manière factuelle." />
              </label>
              <Button type="button" className="mt-3 w-full" icon={CheckCircle2} disabled={decision.trim().length < 3} onClick={() => setDialog('resolve')}>Enregistrer la décision</Button>
            </Card>
          ) : null}
        </aside>
      </div>

      <AdminConfirmDialog
        open={dialog === 'moderation'}
        title="Confirmer l’action de modération"
        description="Vérifiez les preuves avant de modifier le contenu ou le compte ciblé."
        confirmLabel="Appliquer l’action"
        requireReason
        loading={moderationMutation.isPending}
        onClose={() => setDialog(null)}
        onConfirm={(reason) => moderationMutation.mutate(reason)}
      />
      <AdminConfirmDialog
        open={dialog === 'resolve'}
        title="Clôturer ce signalement"
        description={resolution === 'RESOLVED' ? 'Le dossier sera marqué comme résolu.' : 'Le signalement sera rejeté.'}
        confirmLabel="Clôturer"
        tone="primary"
        loading={resolveMutation.isPending}
        onClose={() => setDialog(null)}
        onConfirm={() => resolveMutation.mutate()}
      />
    </AdminPage>
  )
}

function Detail({ label, value }) {
  return <div><dt className="text-xs font-black uppercase text-fifow-muted">{label}</dt><dd className="mt-1 break-words text-sm font-bold text-fifow-dark">{value || '—'}</dd></div>
}

function TargetPreview({ type, target }) {
  if (!target) return <Card className="p-5"><p className="font-bold text-fifow-secondary">La cible n’est plus disponible.</p></Card>
  if (type === 'PRODUCT') return <Card className="p-5"><h3 className="text-lg font-black text-fifow-dark">Annonce concernée</h3><div className="mt-4 flex gap-4">{target.images?.[0]?.url ? <img src={target.images[0].url} alt="" className="h-24 w-24 rounded-lg object-cover" /> : null}<div><p className="font-extrabold text-fifow-dark">{target.title}</p><p className="mt-1 text-sm font-semibold text-fifow-secondary">{target.seller?.fullName} · {target.seller?.email}</p><p className="mt-2 font-black text-fifow-primary">{formatAdminMoney(target.price)}</p><AdminStatusBadge status={target.status} className="mt-2" /></div></div></Card>
  if (type === 'USER') return <Card className="p-5"><h3 className="text-lg font-black text-fifow-dark">Compte concerné</h3><dl className="mt-4 grid gap-4 sm:grid-cols-2"><Detail label="Nom" value={target.fullName} /><Detail label="Email" value={target.email} /><Detail label="Rôle" value={target.role} /><Detail label="Score de confiance" value={target.trustScore} /></dl></Card>
  if (type === 'MESSAGE') return <Card className="p-5"><h3 className="text-lg font-black text-fifow-dark">Message concerné</h3><p className="mt-3 whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-sm font-semibold leading-6 text-fifow-dark">{target.text || 'Message image'}</p>{target.mediaUrl ? <img src={target.mediaUrl} alt="Contenu signalé" className="mt-3 max-h-96 rounded-lg object-contain" /> : null}</Card>
  if (type === 'REVIEW') return <Card className="p-5"><h3 className="text-lg font-black text-fifow-dark">Avis concerné</h3><p className="mt-3 text-xl font-black text-fifow-orange">{target.rating}/5</p><p className="mt-2 whitespace-pre-wrap text-sm font-semibold leading-6 text-fifow-secondary">{target.comment}</p></Card>
  if (type === 'ORDER') return <Card className="p-5"><h3 className="text-lg font-black text-fifow-dark">Commande concernée</h3><dl className="mt-4 grid gap-4 sm:grid-cols-2"><Detail label="Référence" value={target.reference} /><Detail label="Montant" value={formatAdminMoney(target.totalAmount)} /><Detail label="Acheteur" value={target.buyer?.fullName} /><Detail label="Vendeur" value={target.seller?.fullName} /></dl></Card>
  if (type === 'PAYMENT') return <Card className="p-5"><h3 className="text-lg font-black text-fifow-dark">Paiement concerné</h3><dl className="mt-4 grid gap-4 sm:grid-cols-2"><Detail label="Référence" value={target.internalReference} /><Detail label="Montant" value={formatAdminMoney(target.amount)} /><Detail label="Utilisateur" value={target.user?.fullName} /><Detail label="Statut" value={target.status} /></dl></Card>
  return <Card className="p-5"><h3 className="text-lg font-black text-fifow-dark">Cible concernée</h3><p className="mt-3 text-sm font-semibold text-fifow-secondary">Identifiant {shortId(target.id)}</p></Card>
}

