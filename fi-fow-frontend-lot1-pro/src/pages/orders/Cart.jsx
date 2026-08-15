import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, ArrowRight, Minus, Plus, ShieldCheck, ShoppingCart, Trash2 } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { cartApi } from '../../api/cart.js'
import { errorMessage } from '../../api/errors.js'
import { queryKeys } from '../../api/queryKeys.js'
import AppHeader from '../../components/layout/AppHeader.jsx'
import MainLayout from '../../components/layout/MainLayout.jsx'
import Button from '../../components/ui/Button.jsx'
import { formatGNF } from '../../lib/formatters.js'
import { useToast } from '../../lib/toast.jsx'

export default function Cart() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const showToast = useToast()
  const cartQuery = useQuery({ queryKey: queryKeys.cart, queryFn: cartApi.get })
  const cart = cartQuery.data

  const mutation = useMutation({
    mutationFn: ({ action, itemId, quantity }) => action === 'remove'
      ? cartApi.remove(itemId)
      : cartApi.update(itemId, quantity),
    onSuccess: (nextCart) => queryClient.setQueryData(queryKeys.cart, nextCart),
    onError: (error) => showToast(errorMessage(error, 'Le panier n’a pas pu être modifié.'), { type: 'error' }),
  })

  function checkout(group) {
    const first = group.items[0]?.product
    if (!first || !group.canCheckout) return
    navigate(`/products/${first.slug}/buy?cartSeller=${group.seller.id}`, { state: { cartGroup: group } })
  }

  return (
    <MainLayout>
      <AppHeader title="Mon panier" showSearch={false} />
      <main className="marketplace-container py-6 sm:py-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div><p className="text-sm font-extrabold uppercase tracking-wide text-fifow-primary">Vos achats</p><h1 className="mt-1 text-2xl font-black text-fifow-dark sm:text-3xl">Panier</h1></div>
          {cart?.itemCount ? <p className="text-sm font-bold text-fifow-secondary">{cart.itemCount} annonce{cart.itemCount > 1 ? 's' : ''}</p> : null}
        </div>

        {cartQuery.isLoading ? <CartSkeleton /> : null}
        {cartQuery.isError ? <CartError onRetry={cartQuery.refetch} /> : null}
        {!cartQuery.isLoading && !cartQuery.isError && !cart?.itemCount ? <EmptyCart /> : null}

        {cart?.itemCount ? (
          <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="space-y-5">
              {cart.hasPriceChanges ? <Notice icon={AlertTriangle}>Le prix d’une annonce a changé. Le prix actuel est affiché et sera confirmé avant la commande.</Notice> : null}
              {cart.groups.map((group) => (
                <section key={group.seller.id} className="overflow-hidden rounded-xl border border-fifow-border bg-white shadow-card">
                  <header className="flex items-center justify-between gap-4 border-b border-fifow-border bg-slate-50/70 px-4 py-3.5 sm:px-5">
                    <div className="flex min-w-0 items-center gap-3">
                      <img src={group.seller.avatarUrl || '/assets/avatar-default.svg'} alt="" className="h-10 w-10 rounded-full object-cover" />
                      <div className="min-w-0"><p className="truncate text-sm font-black text-fifow-dark">{group.seller.fullName}</p><p className="text-xs font-bold text-fifow-secondary">Commande et livraison indépendantes</p></div>
                    </div>
                    {group.seller.verified ? <span className="hidden rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-700 sm:inline">Vendeur vérifié</span> : null}
                  </header>
                  <div className="divide-y divide-fifow-border">
                    {group.items.map((item) => <CartLine key={item.id} item={item} busy={mutation.isPending && mutation.variables?.itemId === item.id} onUpdate={(quantity) => mutation.mutate({ action: 'update', itemId: item.id, quantity })} onRemove={() => mutation.mutate({ action: 'remove', itemId: item.id })} />)}
                  </div>
                  <footer className="flex flex-col gap-3 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                    <div><p className="text-xs font-bold text-fifow-secondary">Sous-total indicatif</p><p className="text-xl font-black text-fifow-dark">{formatGNF(group.estimatedSubtotal)}</p></div>
                    <Button type="button" icon={ArrowRight} onClick={() => checkout(group)} disabled={!group.canCheckout}>Commander ce groupe</Button>
                  </footer>
                </section>
              ))}
            </div>
            <aside className="rounded-xl border border-fifow-border bg-white p-5 shadow-card xl:sticky xl:top-24">
              <h2 className="text-lg font-black text-fifow-dark">Résumé</h2>
              <div className="mt-4 flex items-center justify-between text-sm font-bold text-fifow-secondary"><span>Sous-total disponible</span><span className="text-fifow-dark">{formatGNF(cart.estimatedSubtotal)}</span></div>
              <p className="mt-4 rounded-lg bg-fifow-lavender p-3 text-xs font-semibold leading-5 text-fifow-secondary">Les frais de protection et de livraison sont calculés séparément pour chaque vendeur au moment du devis.</p>
              <div className="mt-4 flex gap-2 text-sm font-bold text-emerald-800"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" /><span>Aucun stock n’est bloqué tant que vous ne créez pas la commande.</span></div>
            </aside>
          </div>
        ) : null}
      </main>
    </MainLayout>
  )
}

function CartLine({ item, busy, onUpdate, onRemove }) {
  const stockItem = item.product.listingMode === 'STOCK'
  return (
    <article className={`grid grid-cols-[88px_minmax(0,1fr)] gap-4 p-4 sm:grid-cols-[104px_minmax(0,1fr)_auto] sm:p-5 ${!item.canCheckout ? 'bg-red-50/40' : ''}`}>
      <Link to={`/products/${item.product.slug}`} className="aspect-square overflow-hidden rounded-lg bg-slate-100"><img src={item.product.imageUrl || '/assets/empty-product.svg'} alt="" className="h-full w-full object-cover" /></Link>
      <div className="min-w-0">
        <Link to={`/products/${item.product.slug}`} className="line-clamp-2 font-black text-fifow-dark hover:text-fifow-primary">{item.product.title}</Link>
        <p className="mt-2 text-lg font-black text-fifow-primary">{formatGNF(item.currentUnitPrice)}</p>
        {item.priceChanged ? <p className="mt-1 text-xs font-bold text-amber-700">Prix actualisé depuis l’ajout</p> : null}
        {!item.canCheckout ? <p className="mt-1 text-xs font-black text-fifow-red">Indisponible dans cette quantité</p> : null}
        <div className="mt-3 flex items-center gap-2 sm:hidden"><QuantityControl item={item} stockItem={stockItem} busy={busy} onUpdate={onUpdate} /><RemoveButton busy={busy} onRemove={onRemove} /></div>
      </div>
      <div className="hidden min-w-32 flex-col items-end justify-between sm:flex">
        <button type="button" onClick={onRemove} disabled={busy} className="grid h-9 w-9 place-items-center rounded-lg text-fifow-secondary transition hover:bg-red-50 hover:text-fifow-red" aria-label="Retirer du panier"><Trash2 className="h-4 w-4" /></button>
        <QuantityControl item={item} stockItem={stockItem} busy={busy} onUpdate={onUpdate} />
      </div>
    </article>
  )
}

function QuantityControl({ item, stockItem, busy, onUpdate }) {
  if (!stockItem) return <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-fifow-secondary">Article unique</span>
  return <div className="flex h-9 items-center overflow-hidden rounded-lg border border-fifow-border"><button type="button" disabled={busy || item.quantity <= 1} onClick={() => onUpdate(item.quantity - 1)} className="grid h-full w-9 place-items-center disabled:opacity-35" aria-label="Diminuer"><Minus className="h-3.5 w-3.5" /></button><span className="min-w-8 text-center text-sm font-black">{item.quantity}</span><button type="button" disabled={busy || item.quantity >= item.availableQuantity} onClick={() => onUpdate(item.quantity + 1)} className="grid h-full w-9 place-items-center disabled:opacity-35" aria-label="Augmenter"><Plus className="h-3.5 w-3.5" /></button></div>
}

function RemoveButton({ busy, onRemove }) { return <button type="button" onClick={onRemove} disabled={busy} className="grid h-9 w-9 place-items-center rounded-lg border border-fifow-border text-fifow-red" aria-label="Retirer"><Trash2 className="h-4 w-4" /></button> }
function Notice({ icon: Icon, children }) { return <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-900"><Icon className="mt-0.5 h-5 w-5 shrink-0" />{children}</div> }
function CartSkeleton() { return <div className="grid animate-pulse gap-5 xl:grid-cols-[1fr_340px]"><div className="h-80 rounded-xl bg-slate-100" /><div className="h-60 rounded-xl bg-slate-100" /></div> }
function CartError({ onRetry }) { return <div className="rounded-xl border border-red-100 bg-white p-8 text-center"><h2 className="font-black text-fifow-dark">Panier indisponible</h2><p className="mt-2 text-sm font-semibold text-fifow-secondary">Une erreur empêche son chargement.</p><Button onClick={onRetry} className="mt-4">Réessayer</Button></div> }
function EmptyCart() { return <div className="mx-auto grid max-w-xl place-items-center rounded-xl border border-fifow-border bg-white px-6 py-16 text-center shadow-card"><span className="grid h-16 w-16 place-items-center rounded-full bg-fifow-lavender text-fifow-primary"><ShoppingCart className="h-8 w-8" /></span><h2 className="mt-5 text-xl font-black text-fifow-dark">Votre panier est vide</h2><p className="mt-2 max-w-sm text-sm font-semibold leading-6 text-fifow-secondary">Ajoutez les annonces qui vous intéressent. Elles seront automatiquement regroupées par vendeur.</p><Button as={Link} to="/products" className="mt-6">Explorer les annonces</Button></div> }
