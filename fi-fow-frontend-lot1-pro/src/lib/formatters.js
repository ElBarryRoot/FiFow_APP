export function formatGNF(value) {
  return new Intl.NumberFormat('fr-GN', {
    maximumFractionDigits: 0,
  }).format(value) + ' GNF'
}

export function shortLocation(location) {
  return location?.replace('Conakry, ', '') ?? ''
}
