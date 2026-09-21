import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, ArrowRight, Minus, Plus, ShoppingCart, Store, Trash2 } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { cartApi } from '../../api/cart.js'
import { errorMessage } from '../../api/errors.js'
import { queryKeys } from '../../api/queryKeys.js'
import AppHeader from '../../components/layout/AppHeader.jsx'
import MainLayout from '../../components/layout/MainLayout.jsx'
import Button from '../../components/ui/Button.jsx'
import { formatGNF } from '../../lib/formatters.js'
import { listingAvailabilityLabel } from '../../lib/listingAvailability.js'
import { useToast } from '../../lib/toast.jsx'

export default function Cart() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const showToast = useToast()
  const cartQuery = useQuery({ queryKey: queryKeys.cart, queryFn: cartApi.get })
  const cart = cartQuery.data

  const mutation = useMutation({
    mutationFn: ({ action, itemId, quantity }) => (
      action === 'remove' ? cartApi.remove(itemId) : cartApi.update(itemId, quantity)
    ),
    onSuccess: (nextCart) => queryClient.setQueryData(queryKeys.cart, nextCart),
    onError: (error) => {
      showToast(errorMessage(error, 'Le panier n’a pas pu être modifié.'), { type: 'error' })
    },
  })

  function checkout(group) {
    const firstProduct = group.items[0]?.product
    if (!firstProduct || !group.canCheckout) return
    navigate(`/products/${firstProduct.slug}/buy?cartSeller=${group.seller.id}`, {
      state: { cartGroup: group },
    })
  }

  return (
    <MainLayout>
      <AppHeader title="Mon panier" showSearch={false} />
      <main className="marketplace-container py-6 sm:py-9">
        <div className="mx-auto max-w-6xl">
          <CartHeading cart={cart} />

          {cartQuery.isLoading ? <CartSkeleton /> : null}
          {cartQuery.isError ? <CartError onRetry={cartQuery.refetch} /> : null}
          {!cartQuery.isLoading && !cartQuery.isError && !cart?.itemCount ? <EmptyCart /> : null}

          {cart?.itemCount ? (
            <div className="space-y-5">
              {cart.hasUnavailableItems ? (
                <CartNotice tone="danger">
                  Certains articles ne sont plus disponibles. Retirez-les ou ajustez leur quantité.
                </CartNotice>
              ) : null}
              {cart.hasPriceChanges ? (
                <CartNotice>
                  Un prix a changé depuis son ajout. Le montant actuel est déjà affiché.
                </CartNotice>
              ) : null}

              {cart.groups.map((group) => (
                <SellerGroup
                  key={group.seller.id}
                  group={group}
                  mutation={mutation}
                  onCheckout={() => checkout(group)}
                />
              ))}
            </div>
          ) : null}
        </div>
      </main>
    </MainLayout>
  )
}

function CartHeading({ cart }) {
  const groupCount = cart?.groups?.length || 0
  return (
    <header className="mb-6 flex flex-col gap-4 sm:mb-7 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-fifow-lavender text-fifow-primary">
          <ShoppingCart className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-2xl font-black text-fifow-dark sm:text-3xl">Votre panier</h1>
          {cart?.itemCount ? (
            <p className="mt-1 text-sm font-semibold text-fifow-secondary">
              {cart.itemCount} article{cart.itemCount > 1 ? 's' : ''} chez {groupCount} vendeur{groupCount > 1 ? 's' : ''}.
              {' '}Chaque vendeur forme une commande distincte.
            </p>
          ) : null}
        </div>
      </div>
      {cart?.itemCount ? (
        <Link to="/products" className="text-sm font-extrabold text-fifow-primary hover:underline">
          Continuer mes achats
        </Link>
      ) : null}
    </header>
  )
}

function SellerGroup({ group, mutation, onCheckout }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-fifow-border bg-white shadow-card">
      <SellerHeader group={group} />

      <div className="divide-y divide-fifow-border" aria-busy={mutation.isPending}>
        {group.items.map((item) => {
          const busy = mutation.isPending && mutation.variables?.itemId === item.id
          return (
            <CartLine
              key={item.id}
              item={item}
              busy={busy}
              onUpdate={(quantity) => mutation.mutate({ action: 'update', itemId: item.id, quantity })}
              onRemove={() => mutation.mutate({ action: 'remove', itemId: item.id })}
            />
          )
        })}
      </div>

      <footer className="flex flex-col gap-4 border-t border-fifow-border bg-slate-50/70 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-fifow-muted">Sous-total</p>
          <p className="mt-0.5 text-2xl font-black text-fifow-dark">{formatGNF(group.estimatedSubtotal)}</p>
        </div>
        <Button
          type="button"
          icon={ArrowRight}
          onClick={onCheckout}
          disabled={!group.canCheckout}
          className="w-full sm:w-auto"
        >
          Commander chez ce vendeur
        </Button>
      </footer>
    </section>
  )
}

function SellerHeader({ group }) {
  return (
    <header className="flex items-center justify-between gap-4 border-b border-fifow-border px-4 py-3.5 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <img
          src={group.seller.avatarUrl || '/assets/avatar-default.svg'}
          alt=""
          className="h-10 w-10 rounded-full border border-fifow-border object-cover"
        />
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-xs font-bold text-fifow-muted">
            <Store className="h-3.5 w-3.5" /> Vendeur
          </p>
          <p className="truncate text-sm font-black text-fifow-dark sm:text-base">{group.seller.fullName}</p>
        </div>
      </div>
      {group.seller.verified ? (
        <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-700">
          Vérifié
        </span>
      ) : null}
    </header>
  )
}

function CartLine({ item, busy, onUpdate, onRemove }) {
  const stockItem = item.product.listingMode === 'STOCK'
  const multipleUnits = item.quantity > 1
  const availabilityLabel = listingAvailabilityLabel({
    ...item.product,
    availableQuantity: item.availableQuantity,
  })

  return (
    <article className={`grid grid-cols-[82px_minmax(0,1fr)] gap-3 p-4 sm:grid-cols-[104px_minmax(0,1fr)_auto] sm:gap-5 sm:p-6 ${!item.canCheckout ? 'bg-red-50/40' : ''}`}>
      <Link
        to={`/products/${item.product.slug}`}
        className="aspect-square overflow-hidden rounded-xl bg-slate-100"
      >
        <img
          src={item.product.imageUrl || '/assets/empty-product.svg'}
          alt=""
          className="h-full w-full object-cover transition duration-300 hover:scale-[1.03]"
        />
      </Link>

      <div className="min-w-0">
        <Link
          to={`/products/${item.product.slug}`}
          className="line-clamp-2 text-sm font-black leading-5 text-fifow-dark hover:text-fifow-primary sm:text-base"
        >
          {item.product.title}
        </Link>
        <p className="mt-1.5 text-xs font-extrabold text-fifow-secondary">{availabilityLabel}</p>

        <div className="mt-2 sm:hidden">
          <LinePrice item={item} multipleUnits={multipleUnits} />
        </div>

        {item.priceChanged ? (
          <p className="mt-1.5 text-xs font-bold text-amber-700">Prix mis à jour</p>
        ) : null}
        {!item.canCheckout ? (
          <p className="mt-1.5 text-xs font-black text-fifow-red">Quantité indisponible</p>
        ) : null}

        <div className="mt-3 flex items-center gap-2">
          <QuantityControl item={item} stockItem={stockItem} busy={busy} onUpdate={onUpdate} />
          <RemoveButton busy={busy} onRemove={onRemove} />
        </div>
      </div>

      <div className="hidden min-w-40 text-right sm:block">
        <LinePrice item={item} multipleUnits={multipleUnits} />
      </div>
    </article>
  )
}

function LinePrice({ item, multipleUnits }) {
  return (
    <div>
      <p className="text-lg font-black text-fifow-primary">{formatGNF(item.lineTotal)}</p>
      {multipleUnits ? (
        <p className="mt-0.5 text-xs font-semibold text-fifow-muted">
          {item.quantity} × {formatGNF(item.currentUnitPrice)}
        </p>
      ) : null}
    </div>
  )
}

function QuantityControl({ item, stockItem, busy, onUpdate }) {
  if (!stockItem) {
    return (
      <span className="inline-flex h-10 items-center rounded-lg bg-slate-100 px-3 text-xs font-black text-fifow-secondary">
        {item.product.listingMode === 'LOT' ? '1 lot' : '1 article'}
      </span>
    )
  }

  return (
    <div className="flex h-10 items-center overflow-hidden rounded-lg border border-fifow-border bg-white">
      <button
        type="button"
        disabled={busy || item.quantity <= 1}
        onClick={() => onUpdate(item.quantity - 1)}
        className="grid h-full w-10 place-items-center text-fifow-dark transition hover:bg-slate-50 disabled:opacity-35"
        aria-label="Diminuer la quantité"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <span className="min-w-9 text-center text-sm font-black text-fifow-dark">{item.quantity}</span>
      <button
        type="button"
        disabled={busy || item.quantity >= item.availableQuantity}
        onClick={() => onUpdate(item.quantity + 1)}
        className="grid h-full w-10 place-items-center text-fifow-dark transition hover:bg-slate-50 disabled:opacity-35"
        aria-label="Augmenter la quantité"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

function RemoveButton({ busy, onRemove }) {
  return (
    <button
      type="button"
      onClick={onRemove}
      disabled={busy}
      className="grid h-10 w-10 place-items-center rounded-lg border border-transparent text-fifow-muted transition hover:border-red-100 hover:bg-red-50 hover:text-fifow-red disabled:opacity-40"
      aria-label="Retirer du panier"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  )
}

function CartNotice({ children, tone = 'warning' }) {
  const colors = tone === 'danger'
    ? 'border-red-200 bg-red-50 text-red-900'
    : 'border-amber-200 bg-amber-50 text-amber-900'
  return (
    <div className={`flex gap-3 rounded-xl border px-4 py-3 text-sm font-bold leading-6 ${colors}`}>
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
      <span>{children}</span>
    </div>
  )
}

function CartSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="h-72 rounded-2xl bg-slate-100" />
      <div className="h-56 rounded-2xl bg-slate-100" />
    </div>
  )
}

function CartError({ onRetry }) {
  return (
    <div className="rounded-2xl border border-red-100 bg-white p-8 text-center shadow-card">
      <h2 className="font-black text-fifow-dark">Panier indisponible</h2>
      <p className="mt-2 text-sm font-semibold text-fifow-secondary">Une erreur empêche son chargement.</p>
      <Button onClick={onRetry} className="mt-4">Réessayer</Button>
    </div>
  )
}

function EmptyCart() {
  return (
    <div className="mx-auto grid max-w-xl place-items-center rounded-2xl border border-fifow-border bg-white px-6 py-16 text-center shadow-card">
      <span className="grid h-16 w-16 place-items-center rounded-full bg-fifow-lavender text-fifow-primary">
        <ShoppingCart className="h-8 w-8" />
      </span>
      <h2 className="mt-5 text-xl font-black text-fifow-dark">Votre panier est vide</h2>
      <p className="mt-2 max-w-sm text-sm font-semibold leading-6 text-fifow-secondary">
        Retrouvez ici les articles que vous souhaitez commander.
      </p>
      <Button as={Link} to="/products" className="mt-6">Explorer les annonces</Button>
    </div>
  )
}
