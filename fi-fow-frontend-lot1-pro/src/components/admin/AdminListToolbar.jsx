import { Search, X } from 'lucide-react'
import Input from '../ui/Input.jsx'
import Select from '../ui/Select.jsx'

export default function AdminListToolbar({
  search,
  onSearchChange,
  searchPlaceholder = 'Rechercher…',
  status,
  onStatusChange,
  statusOptions = [],
  children,
}) {
  const hasFilters = Boolean(search || status)

  return (
    <div className="mb-4 flex flex-col gap-3 rounded-lg border border-fifow-border bg-white p-3 sm:flex-row sm:items-center">
      {onSearchChange ? (
        <Input
          icon={Search}
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={searchPlaceholder}
          className="h-11 min-w-0 flex-1 sm:max-w-md"
          inputClassName="text-sm"
        />
      ) : null}
      {onStatusChange ? (
        <Select value={status} onChange={(event) => onStatusChange(event.target.value)} className="h-11 sm:w-56">
          <option value="">Tous les statuts</option>
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </Select>
      ) : null}
      {children}
      {hasFilters ? (
        <button
          type="button"
          onClick={() => {
            onSearchChange?.('')
            onStatusChange?.('')
          }}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg px-3 text-sm font-extrabold text-fifow-secondary hover:bg-slate-100"
        >
          <X className="h-4 w-4" /> Effacer
        </button>
      ) : null}
    </div>
  )
}

