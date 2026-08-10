import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Archive, EyeOff, RotateCcw } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { adminApi } from '../../api/admin.js'
import { errorMessage } from '../../api/errors.js'
import AdminConfirmDialog from '../../components/admin/AdminConfirmDialog.jsx'
import AdminListToolbar from '../../components/admin/AdminListToolbar.jsx'
import AdminLoadMore from '../../components/admin/AdminLoadMore.jsx'
import AdminPage from '../../components/admin/AdminPage.jsx'
import AdminStatusBadge, { adminStatusLabel } from '../../components/admin/AdminStatusBadge.jsx'
import { AdminEmpty, AdminError, AdminLoading } from '../../components/admin/AdminState.jsx'
import AdminTable from '../../components/admin/AdminTable.jsx'
import Button from '../../components/ui/Button.jsx'
import { useDebouncedValue } from '../../hooks/useDebouncedValue.js'
import { flattenAdminPages, formatAdminDate, formatAdminMoney } from '../../lib/adminFormatters.js'
import { useToast } from '../../lib/toast.jsx'

const statuses = ['DRAFT', 'PENDING_REVIEW', 'AVAILABLE', 'RESERVED', 'SOLD', 'REJECTED', 'HIDDEN', 'ARCHIVED'].map((value) => ({ value, label: adminStatusLabel(value) }))

export default function AdminProducts() {
  const showToast = useToast()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [dialog, setDialog] = useState(null)
  const debouncedSearch = useDebouncedValue(search.trim())
  const query = useInfiniteQuery({
    queryKey: ['admin', 'products', { search: debouncedSearch, status }],
    queryFn: ({ pageParam }) => adminApi.products.list({ search: debouncedSearch, status, cursor: pageParam, limit: 30 }),
    initialPageParam: undefined,
    getNextPageParam: (page) => page.nextCursor || undefined,
  })
  const rows = flattenAdminPages(query.data)
  const mutation = useMutation({
    mutationFn: ({ row, action, reason }) => adminApi.moderation.apply({ targetType: 'PRODUCT', targetId: row.id, action, reason }),
    onSuccess() { queryClient.invalidateQueries({ queryKey: ['admin', 'products'] }); queryClient.invalidateQueries({ queryKey: ['products'] }); showToast('Annonce mise à jour.'); setDialog(null) },
    onError: (error) => showToast(errorMessage(error), { type: 'error' }),
  })
  const columns = useMemo(() => [
    { key: 'product', label: 'Annonce', render: (row) => <div className="flex min-w-64 items-center gap-3"><img src={productImage(row)} alt="" className="h-12 w-12 rounded-lg bg-slate-100 object-cover" /><div className="min-w-0"><Link to={`/products/${row.slug || row.id}`} className="block truncate font-extrabold text-fifow-dark hover:text-fifow-primary">{row.title}</Link><p className="text-xs text-fifow-muted">{row.seller?.fullName || 'Vendeur inconnu'}</p></div></div> },
    { key: 'price', label: 'Prix', render: (row) => <span className="font-extrabold text-fifow-dark">{formatAdminMoney(row.price)}</span> },
    { key: 'location', label: 'Localisation', render: (row) => [row.quartier, row.commune].filter(Boolean).join(', ') || '—' },
    { key: 'reports', label: 'Signalements', render: (row) => row.reportsCount || 0 },
    { key: 'createdAt', label: 'Créée', render: (row) => formatAdminDate(row.createdAt) },
    { key: 'status', label: 'Statut', render: (row) => <AdminStatusBadge status={row.status} /> },
  ], [])
  return <AdminPage eyebrow="Qualité du catalogue" title="Annonces" description="Surveillez les annonces publiées, signalées ou en attente de validation.">
    <AdminListToolbar search={search} onSearchChange={setSearch} searchPlaceholder="Titre de l’annonce" status={status} onStatusChange={setStatus} statusOptions={statuses} />
    {query.isLoading ? <AdminLoading /> : null}{query.isError ? <AdminError onRetry={query.refetch} /> : null}
    {rows.length ? <AdminTable columns={columns} rows={rows} mobileTitle={(row) => row.title} mobileSubtitle={(row) => `${row.seller?.fullName || 'Vendeur'} · ${formatAdminMoney(row.price)}`} mobileMeta={(row) => <AdminStatusBadge status={row.status} />} actions={(row) => <ProductActions row={row} onAction={setDialog} />} /> : null}
    {!query.isLoading && !query.isError && !rows.length ? <AdminEmpty title="Aucune annonce" /> : null}
    <AdminLoadMore hasNextPage={query.hasNextPage} loading={query.isFetchingNextPage} onClick={query.fetchNextPage} />
    <AdminConfirmDialog open={Boolean(dialog)} title={productActionTitle(dialog?.action)} description="La visibilité de l’annonce sera modifiée immédiatement et l’action sera auditée." confirmLabel="Appliquer" requireReason loading={mutation.isPending} onClose={() => setDialog(null)} onConfirm={(reason) => mutation.mutate({ ...dialog, reason })} />
  </AdminPage>
}

function ProductActions({ row, onAction }) {
  if (['HIDDEN', 'ARCHIVED', 'REJECTED'].includes(row.status)) return <Button type="button" size="sm" variant="secondary" icon={RotateCcw} onClick={() => onAction({ row, action: 'RESTORE_PRODUCT' })}>Restaurer</Button>
  return <div className="flex justify-end gap-2"><Button type="button" size="sm" variant="secondary" icon={EyeOff} onClick={() => onAction({ row, action: 'HIDE_PRODUCT' })}>Masquer</Button><Button type="button" size="sm" variant="danger" icon={Archive} onClick={() => onAction({ row, action: 'ARCHIVE_PRODUCT' })}>Archiver</Button></div>
}
function productImage(row) { return row.mainImage?.url || row.mainImageUrl || row.images?.[0]?.url || row.images?.[0]?.publicUrl || '/assets/empty-product.svg' }
function productActionTitle(action) { return ({ HIDE_PRODUCT: 'Masquer cette annonce', ARCHIVE_PRODUCT: 'Archiver cette annonce', RESTORE_PRODUCT: 'Restaurer cette annonce' })[action] || 'Modifier cette annonce' }
