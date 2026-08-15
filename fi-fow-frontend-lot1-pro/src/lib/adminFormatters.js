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
  const amount = typeof value === 'string' && /^-?\d+$/.test(value.trim())
    ? BigInt(value.trim())
    : typeof value === 'bigint'
      ? value
      : Number.isFinite(Number(value))
        ? Number(value)
        : 0
  return `${new Intl.NumberFormat('fr-FR').format(amount)} GNF`
}

export function shortId(value) {
  if (!value) return '—'
  return value.length > 14 ? `${value.slice(0, 8)}…${value.slice(-4)}` : value
}

export function flattenAdminPages(data) {
  return data?.pages?.flatMap((page) => page.items || []) || []
}
