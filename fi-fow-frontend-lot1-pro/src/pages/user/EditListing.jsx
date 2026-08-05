import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ImagePlus, Save, Send, Star, Trash2 } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { catalogueApi } from '../../api/catalogue.js'
import { errorMessage, isApiError } from '../../api/errors.js'
import { queryKeys } from '../../api/queryKeys.js'
import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'
import Input from '../../components/ui/Input.jsx'
import Select from '../../components/ui/Select.jsx'
import Textarea from '../../components/ui/Textarea.jsx'
import UserPageShell from '../../components/user/UserPageShell.jsx'
import { deliveryOptions, productConditions } from '../../data/publishOptions.js'
import { useCategories } from '../../hooks/useCatalogue.js'
import { useToast } from '../../lib/toast.jsx'

const editableStatuses = new Set(['DRAFT', 'REJECTED'])

export default function EditListing() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const showToast = useToast()
  const formRef = useRef(null)
  const listingsQuery = useQuery({ queryKey: queryKeys.myProducts, queryFn: catalogueApi.mine })
  const categoriesQuery = useCategories()
  const listing = listingsQuery.data?.find((item) => item.id === id)
  const [categoryId, setCategoryId] = useState('')
  const [subcategoryId, setSubcategoryId] = useState('')
  const [negotiable, setNegotiable] = useState(false)
  const [handoverModes, setHandoverModes] = useState([])
  const [fieldErrors, setFieldErrors] = useState({})

  useEffect(() => {
    if (!listing) return
    setCategoryId(listing.category?.id || '')
    setSubcategoryId(listing.subcategory?.id || '')
    setNegotiable(listing.negotiable)
    setHandoverModes(listing.handoverModes || [])
  }, [listing])

  const invalidate = () => queryClient.invalidateQueries({ queryKey: queryKeys.myProducts })
  const updateMutation = useMutation({ mutationFn: (input) => catalogueApi.update(id, input), onSuccess: invalidate })
  const publishMutation = useMutation({ mutationFn: () => catalogueApi.publish(id), onSuccess: invalidate })
  const imageMutation = useMutation({ mutationFn: ({ action, imageId, file }) => {
    if (action === 'add') return catalogueApi.addImage(id, file)
    if (action === 'delete') return catalogueApi.deleteImage(id, imageId)
    return catalogueApi.setMainImage(id, imageId)
  }, onSuccess: invalidate })

  function formInput() {
    const form = new FormData(formRef.current)
    return {
      title: String(form.get('title')).trim(),
      description: String(form.get('description')).trim(),
      price: String(form.get('price')).replace(/\D/g, ''),
      condition: String(form.get('condition')),
      isNegotiable: negotiable,
      categoryId,
      subcategoryId,
      commune: String(form.get('commune')).trim(),
      quartier: String(form.get('quartier')).trim(),
      handoverModes,
    }
  }

  async function save(event) {
    event?.preventDefault()
    setFieldErrors({})
    try {
      await updateMutation.mutateAsync(formInput())
      showToast('Brouillon mis à jour.')
      return true
    } catch (requestError) {
      if (isApiError(requestError)) setFieldErrors(requestError.fieldErrors())
      showToast(errorMessage(requestError, 'Modification impossible.'), { type: 'error' })
      return false
    }
  }

  async function publish() {
    if (!(await save())) return
    try {
      const product = await publishMutation.mutateAsync()
      showToast(product.status === 'AVAILABLE' ? 'Annonce en ligne.' : 'Annonce envoyée en modération.')
      navigate('/profile/listings')
    } catch (requestError) {
      showToast(errorMessage(requestError, 'Publication impossible.'), { type: 'error' })
    }
  }

  async function addImage(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      await imageMutation.mutateAsync({ action: 'add', file })
      showToast('Photo ajoutée.')
    } catch (requestError) {
      showToast(errorMessage(requestError, 'Photo impossible à envoyer.'), { type: 'error' })
    }
  }

  async function imageAction(action, imageId) {
    if (action === 'delete' && !window.confirm('Supprimer cette photo ?')) return
    try {
      await imageMutation.mutateAsync({ action, imageId })
      showToast(action === 'delete' ? 'Photo supprimée.' : 'Photo principale mise à jour.')
    } catch (requestError) {
      showToast(errorMessage(requestError, 'Action impossible.'), { type: 'error' })
    }
  }

  if (listingsQuery.isLoading) return <UserPageShell title="Modifier l’annonce"><div className="h-96 animate-pulse rounded-lg bg-slate-100" /></UserPageShell>
  if (listingsQuery.isError) return <UserPageShell title="Modifier l’annonce" backTo="/profile/listings"><Card className="p-8 text-center" role="alert"><p className="font-bold text-fifow-red">L’annonce ne peut pas être chargée.</p><Button type="button" className="mt-4" onClick={() => listingsQuery.refetch()}>Réessayer</Button></Card></UserPageShell>
  if (!listing) return <UserPageShell title="Annonce introuvable" backTo="/profile/listings"><Card className="p-8 text-center"><p className="font-bold text-fifow-secondary">Cette annonce ne fait pas partie de votre compte.</p></Card></UserPageShell>
  if (!editableStatuses.has(listing.status)) return <UserPageShell title="Annonce non modifiable" backTo="/profile/listings"><Card className="p-8 text-center"><p className="font-bold text-fifow-secondary">Une annonce {listing.statusLabel.toLowerCase()} ne peut plus être modifiée directement.</p><Button as={Link} to={`/products/${listing.slug}`} className="mt-5">Voir l’annonce</Button></Card></UserPageShell>
  if (categoriesQuery.isError) return <UserPageShell title="Modifier l’annonce" backTo="/profile/listings"><Card className="p-8 text-center" role="alert"><p className="font-bold text-fifow-red">Les catégories ne peuvent pas être chargées.</p><Button type="button" className="mt-4" onClick={() => categoriesQuery.refetch()}>Réessayer</Button></Card></UserPageShell>

  const selectedCategory = categoriesQuery.data?.find((category) => category.id === categoryId)
  const busy = updateMutation.isPending || publishMutation.isPending || imageMutation.isPending
  return (
    <UserPageShell title="Modifier l’annonce" subtitle="Mettez à jour le brouillon avant de le soumettre." backTo="/profile/listings" backLabel="Retour à mes annonces">
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card as="form" ref={formRef} onSubmit={save} className="space-y-5 p-5 sm:p-7">
          <div><Input name="title" defaultValue={listing.title} minLength={5} maxLength={120} required />{fieldErrors.title ? <FieldError message={fieldErrors.title} /> : null}</div>
          <div><Textarea name="description" defaultValue={listing.description} minLength={20} maxLength={10000} className="min-h-40" required />{fieldErrors.description ? <FieldError message={fieldErrors.description} /> : null}</div>
          <div className="grid gap-4 sm:grid-cols-2"><Input name="price" defaultValue={listing.price} inputMode="numeric" required /><Select name="condition" defaultValue={listing.conditionCode}>{productConditions.map((condition) => <option key={condition.value} value={condition.value}>{condition.label}</option>)}</Select></div>
          <div className="grid gap-4 sm:grid-cols-2"><Select value={categoryId} onChange={(event) => { setCategoryId(event.target.value); setSubcategoryId('') }}><option value="">Catégorie</option>{categoriesQuery.data?.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</Select><Select value={subcategoryId} onChange={(event) => setSubcategoryId(event.target.value)}><option value="">Sous-catégorie</option>{selectedCategory?.children.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</Select></div>
          <div className="grid gap-4 sm:grid-cols-2"><Input name="commune" defaultValue={listing.commune} placeholder="Commune" required /><Input name="quartier" defaultValue={listing.quartier} placeholder="Quartier" required /></div>
          <label className="flex items-center justify-between rounded-lg border border-fifow-border p-4 font-bold text-fifow-dark">Prix négociable<input type="checkbox" checked={negotiable} onChange={(event) => setNegotiable(event.target.checked)} className="h-5 w-5 accent-fifow-primary" /></label>
          <fieldset><legend className="font-black text-fifow-dark">Modes de remise</legend><div className="mt-3 grid gap-2 sm:grid-cols-3">{deliveryOptions.map((option) => <label key={option.id} className="flex items-center gap-2 rounded-lg border border-fifow-border p-3 text-sm font-bold text-fifow-secondary"><input type="checkbox" checked={handoverModes.includes(option.id)} onChange={() => setHandoverModes((current) => current.includes(option.id) ? current.filter((item) => item !== option.id) : [...current, option.id])} className="accent-fifow-primary" />{option.title}</label>)}</div></fieldset>
          <div className="grid gap-3 sm:grid-cols-2"><Button type="submit" icon={Save} loading={updateMutation.isPending}>Enregistrer</Button><Button type="button" icon={Send} loading={publishMutation.isPending} disabled={busy} onClick={publish}>Soumettre l’annonce</Button></div>
        </Card>
        <Card className="h-max p-5"><h2 className="text-xl font-black text-fifow-dark">Photos</h2><div className="mt-4 grid grid-cols-2 gap-3">{listing.images.map((image) => <div key={image.id} className="relative overflow-hidden rounded-lg border border-fifow-border"><img src={image.url} alt="" className="aspect-square w-full object-cover" /><div className="absolute inset-x-1 bottom-1 flex justify-end gap-1">{!image.isMain ? <button type="button" onClick={() => imageAction('main', image.id)} aria-label="Définir comme photo principale" className="grid h-8 w-8 place-items-center rounded-md bg-white text-fifow-primary"><Star className="h-4 w-4" /></button> : null}<button type="button" onClick={() => imageAction('delete', image.id)} aria-label="Supprimer la photo" className="grid h-8 w-8 place-items-center rounded-md bg-white text-fifow-red"><Trash2 className="h-4 w-4" /></button></div></div>)}{listing.images.length < 6 ? <label className="grid aspect-square cursor-pointer place-items-center rounded-lg border-2 border-dashed border-violet-200 text-fifow-primary"><input type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" onChange={addImage} className="sr-only" /><ImagePlus className="h-7 w-7" /></label> : null}</div></Card>
      </div>
    </UserPageShell>
  )
}

function FieldError({ message }) {
  return <p className="mt-1 text-sm font-bold text-fifow-red">{message}</p>
}
