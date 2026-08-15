export function formatGNF(value) {
  const amount = typeof value === 'string' && /^-?\d+$/.test(value.trim())
    ? BigInt(value.trim())
    : typeof value === 'bigint'
      ? value
      : Number.isFinite(Number(value))
        ? Number(value)
        : 0
  return new Intl.NumberFormat('fr-GN', {
    maximumFractionDigits: 0,
  }).format(amount) + ' GNF'
}

export function shortLocation(location) {
  return location?.replace('Conakry, ', '') ?? ''
}
