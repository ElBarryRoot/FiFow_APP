import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import Button from '../ui/Button.jsx'
import { cn } from '../../lib/utils.js'

export default function AdminTable({ columns, rows, rowKey = 'id', rowLink, mobileTitle, mobileSubtitle, mobileMeta, actions }) {
  return (
    <div className="overflow-hidden rounded-lg border border-fifow-border bg-white">
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-slate-50 text-xs font-black uppercase text-fifow-secondary">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className={cn('whitespace-nowrap border-b border-fifow-border px-4 py-3', column.className)}>{column.label}</th>
              ))}
              {actions || rowLink ? <th className="w-16 border-b border-fifow-border px-4 py-3 text-right">Action</th> : null}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={typeof rowKey === 'function' ? rowKey(row) : row[rowKey]} className="border-b border-fifow-border last:border-b-0 hover:bg-slate-50/70">
                {columns.map((column) => (
                  <td key={column.key} className={cn('px-4 py-3 align-middle font-semibold text-fifow-secondary', column.cellClassName)}>
                    {column.render ? column.render(row) : row[column.key]}
                  </td>
                ))}
                {actions || rowLink ? (
                  <td className="px-4 py-3 text-right">
                    {actions ? actions(row) : (
                      <Link to={rowLink(row)} aria-label="Ouvrir le détail" className="inline-grid h-9 w-9 place-items-center rounded-lg text-fifow-primary hover:bg-fifow-lavender">
                        <ChevronRight className="h-5 w-5" />
                      </Link>
                    )}
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-fifow-border md:hidden">
        {rows.map((row) => {
          const key = typeof rowKey === 'function' ? rowKey(row) : row[rowKey]
          return (
            <article key={key} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="break-words font-extrabold text-fifow-dark">{mobileTitle?.(row) || row.id}</h3>
                  {mobileSubtitle ? <p className="mt-1 break-words text-sm font-semibold text-fifow-secondary">{mobileSubtitle(row)}</p> : null}
                </div>
                {mobileMeta ? mobileMeta(row) : null}
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                {columns.slice(1, 5).map((column) => (
                  <div key={column.key} className="min-w-0">
                    <dt className="text-xs font-bold text-fifow-muted">{column.label}</dt>
                    <dd className="mt-0.5 break-words font-semibold text-fifow-secondary">{column.render ? column.render(row) : row[column.key]}</dd>
                  </div>
                ))}
              </dl>
              {actions || rowLink ? (
                <div className="mt-4 border-t border-fifow-border pt-3">
                  {actions ? actions(row) : <Button as={Link} to={rowLink(row)} size="sm" variant="secondary" className="w-full">Voir le détail</Button>}
                </div>
              ) : null}
            </article>
          )
        })}
      </div>
    </div>
  )
}

