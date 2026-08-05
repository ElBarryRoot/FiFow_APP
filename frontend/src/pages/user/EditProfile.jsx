import { Save } from 'lucide-react'
import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'
import Input from '../../components/ui/Input.jsx'
import Select from '../../components/ui/Select.jsx'
import UserPageShell from '../../components/user/UserPageShell.jsx'
import { userProfile } from '../../data/clientPortal.js'

export default function EditProfile() {
  return (
    <UserPageShell title="Modifier profil" subtitle="Gardez vos informations à jour pour sécuriser vos échanges." backTo="/profile" backLabel="Retour au profil">
      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <Card className="h-max p-5 text-center">
          <img src={userProfile.avatar} alt={userProfile.name} className="mx-auto h-32 w-32 rounded-full object-cover" />
          <Button variant="secondary" className="mt-5 w-full">Changer la photo</Button>
        </Card>
        <Card className="space-y-5 p-5 sm:p-7">
          <Input defaultValue={userProfile.name} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input defaultValue={userProfile.phone} />
            <Input defaultValue={userProfile.email} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Select defaultValue="Ratoma"><option>Ratoma</option><option>Dixinn</option><option>Matam</option><option>Matoto</option><option>Kaloum</option></Select>
            <Input defaultValue="Kipé" />
          </div>
          <Button icon={Save} className="w-full sm:w-auto">Enregistrer le profil</Button>
        </Card>
      </div>
    </UserPageShell>
  )
}
