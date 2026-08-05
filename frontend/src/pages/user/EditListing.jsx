import { Save, Trash2 } from 'lucide-react'
import { Navigate, useParams } from 'react-router-dom'
import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'
import Input from '../../components/ui/Input.jsx'
import Select from '../../components/ui/Select.jsx'
import Textarea from '../../components/ui/Textarea.jsx'
import UserPageShell from '../../components/user/UserPageShell.jsx'
import { myListings } from '../../data/clientPortal.js'

export default function EditListing() {
  const { id } = useParams()
  const listing = myListings.find((item) => item.id === id)
  if (!listing) return <Navigate to="/profile/listings" replace />
  return (
    <UserPageShell title="Modifier annonce" subtitle="Mettez à jour les informations visibles par les acheteurs." backTo="/profile/listings" backLabel="Retour à mes annonces">
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card className="space-y-5 p-5 sm:p-7">
          <Input defaultValue={listing.title} />
          <Textarea defaultValue="Produit en très bon état, disponible à Conakry. Prix légèrement négociable si achat rapide." />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input defaultValue={listing.price} type="number" />
            <Select defaultValue="Très bon état"><option>Neuf</option><option>Très bon état</option><option>Bon état</option></Select>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Button icon={Save}>Enregistrer les modifications</Button>
            <Button variant="danger" icon={Trash2}>Retirer l’annonce</Button>
          </div>
        </Card>
        <Card className="p-5">
          <img src={listing.image} alt={listing.title} className="h-64 w-full rounded-3xl object-cover" />
          <h2 className="mt-4 text-xl font-black text-fifow-dark">Aperçu rapide</h2>
          <p className="mt-2 text-sm font-semibold text-fifow-secondary">Les acheteurs verront vos changements après validation.</p>
        </Card>
      </div>
    </UserPageShell>
  )
}
