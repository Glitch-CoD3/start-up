export function formatCurrency(value) {
  return new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency: 'BDT',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)
}

export function getVariantLabel(variant) {
  if (!variant) return 'Standard'
  const options = [...(variant.colors ?? []), ...(variant.sizes ?? [])]
  return options.length ? options.join(' · ') : 'Standard'
}