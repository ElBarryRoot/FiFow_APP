import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Save } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { adminApi } from '../../api/admin.js'
import { errorMessage } from '../../api/errors.js'
import AdminPage from '../../components/admin/AdminPage.jsx'
import { AdminEmpty, AdminError, AdminLoading } from '../../components/admin/AdminState.jsx'
import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'
import Input from '../../components/ui/Input.jsx'
import Switch from '../../components/ui/Switch.jsx'
import Textarea from '../../components/ui/Textarea.jsx'
import { formatAdminDate } from '../../lib/adminFormatters.js'
import { useToast } from '../../lib/toast.jsx'

export default function AdminSettings() {
  const query = useQuery({ queryKey: ['admin', 'settings'], queryFn: adminApi.settings.list })
  return <AdminPage eyebrow="Configuration" title="Réglages" description="Modifiez les paramètres métier avec leur type d’origine et sans conversion implicite.">
    {query.isLoading ? <AdminLoading /> : null}
    {query.isError ? <AdminError onRetry={query.refetch} /> : null}
    {query.data?.length ? <div className="grid gap-4 xl:grid-cols-2">{query.data.map((setting) => <SettingEditor key={setting.key} setting={setting} />)}</div> : null}
    {!query.isLoading && !query.isError && !query.data?.length ? <AdminEmpty title="Aucun réglage" description="Aucun réglage administrable n’est configuré." /> : null}
  </AdminPage>
}

function SettingEditor({ setting }) {
  const queryClient = useQueryClient()
  const showToast = useToast()
  const initial = useMemo(() => editorValue(setting), [setting])
  const [value, setValue] = useState(initial)
  const [inputError, setInputError] = useState('')
  useEffect(() => { setValue(initial); setInputError('') }, [initial])
  const mutation = useMutation({
    mutationFn: (parsed) => adminApi.settings.update(setting.key, parsed),
    onSuccess() { queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] }); showToast('Réglage enregistré.') },
    onError: (error) => showToast(errorMessage(error), { type: 'error' }),
  })
  const dirty = value !== initial
  function submit(event) {
    event.preventDefault()
    try {
      const parsed = parsedValue(setting.valueType, value)
      setInputError('')
      mutation.mutate(parsed)
    } catch {
      setInputError(setting.valueType === 'JSON' ? 'Le JSON doit être valide.' : 'La valeur numérique est invalide.')
    }
  }
  return <Card as="form" onSubmit={submit} className="p-5">
    <div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="break-all font-mono text-sm font-black text-fifow-dark">{setting.key}</h3><p className="mt-1 text-sm font-semibold leading-6 text-fifow-secondary">{setting.description || 'Paramètre interne FiFow.'}</p></div><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-fifow-secondary">{setting.valueType}</span></div>
    <div className="mt-4"><SettingInput type={setting.valueType} value={value} onChange={setValue} /><p className="mt-2 text-xs font-semibold text-fifow-muted">Dernière mise à jour : {formatAdminDate(setting.updatedAt)}</p>{inputError ? <p className="mt-2 text-sm font-bold text-fifow-red" role="alert">{inputError}</p> : null}</div>
    <div className="mt-4 flex justify-end"><Button type="submit" size="sm" icon={Save} loading={mutation.isPending} disabled={!dirty}>Enregistrer</Button></div>
  </Card>
}

function SettingInput({ type, value, onChange }) {
  if (type === 'BOOLEAN') return <div className="flex items-center justify-between rounded-lg border border-fifow-border p-3"><span className="text-sm font-extrabold text-fifow-dark">{value === 'true' ? 'Activé' : 'Désactivé'}</span><Switch checked={value === 'true'} onChange={(checked) => onChange(String(checked))} label="Modifier le réglage" /></div>
  if (type === 'JSON') return <Textarea value={value} onChange={(event) => onChange(event.target.value)} spellCheck={false} className="min-h-40 font-mono text-sm" />
  return <Input value={value} onChange={(event) => onChange(type === 'NUMBER' ? event.target.value.replace(/[^0-9.-]/g, '') : event.target.value)} inputMode={type === 'NUMBER' ? 'decimal' : undefined} className="h-12" />
}
function editorValue(setting) { if (setting.valueType === 'JSON') return JSON.stringify(setting.value, null, 2); return String(setting.value ?? '') }
function parsedValue(type, value) { if (type === 'BOOLEAN') return value === 'true'; if (type === 'NUMBER') { const number = Number(value); if (!Number.isFinite(number)) throw new Error('invalid number'); return number } if (type === 'JSON') { const parsed = JSON.parse(value); if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') throw new Error('invalid json object'); return parsed } return value }
