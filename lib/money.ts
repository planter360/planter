export function formatEuros(cents: number): string {
  return (cents / 100).toLocaleString('ca-ES', { style: 'currency', currency: 'EUR' })
}

export function eurosToCents(value: string): number {
  const n = Number(value.replace(',', '.'))
  return Math.round((Number.isFinite(n) ? n : 0) * 100)
}
