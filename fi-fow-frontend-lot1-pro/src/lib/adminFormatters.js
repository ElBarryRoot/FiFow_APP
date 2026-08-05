export function formatAdminDate(value, options = {}) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('fr-GN', {
    dateStyle: options.dateStyle || 'medium',
    ...(options.time === false ? {} : { timeStyle: 'short' }),
  }).format(date)
}

export function formatAdminMoney(value) {
  const amount = Number(value || 0)
  return `${new Intl.NumberFormat('fr-FR').format(Number.isFinite(amount) ? amount : 0)} GNF`
}

export function shortId(value) {
  if (!value) return '—'
  return value.length > 14 ? `${value.slice(0, 8)}…${value.slice(-4)}` : value
}

export function flattenAdminPages(data) {
  return data?.pages?.flatMap((page) => page.items || []) || []
}

