import OrderSummaryCard from '../../components/user/OrderSummaryCard.jsx'
import HumanSectionHeader from '../../components/user/HumanSectionHeader.jsx'
import HumanStatCard from '../../components/user/HumanStatCard.jsx'
import HumanTrustPanel from '../../components/user/HumanTrustPanel.jsx'
import UserPageShell from '../../components/user/UserPageShell.jsx'
import { orders } from '../../data/clientPortal.js'

export default function Orders() {
  return (
    <UserPageShell title="Mes commandes" eyebrow="Achats et suivi" subtitle="Retrouvez vos achats, statuts de paiement, livraisons et actions importantes." tone="trust">
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <section>
          <HumanSectionHeader eyebrow="Historique" title="Commandes récentes" description="Chaque commande garde les informations utiles pour contacter le vendeur, suivre la livraison ou laisser un avis." />
          <div className="space-y-4">
            {orders.map((order) => <OrderSummaryCard key={order.id} order={order} />)}
          </div>
        </section>
        <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
          <div className="grid grid-cols-3 gap-3 lg:grid-cols-1">
            <HumanStatCard label="Livrées" value="1" helper="terminée" tone="green" />
            <HumanStatCard label="En cours" value="1" helper="à suivre" />
            <HumanStatCard label="À vérifier" value="1" helper="paiement" tone="orange" />
          </div>
          <HumanTrustPanel title="Après achat" text="Gardez les échanges et preuves dans Fi Fow pour faciliter l’assistance." items={['Référence commande', 'Discussion vendeur', 'Statut de paiement', 'Avis après livraison']} />
        </aside>
      </div>
    </UserPageShell>
  )
}
