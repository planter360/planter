export const DAYS: [code: string, label: string][] = [
  ['Dl', 'Dilluns'],
  ['Dt', 'Dimarts'],
  ['Dc', 'Dimecres'],
  ['Dj', 'Dijous'],
  ['Dv', 'Divendres'],
  ['Ds', 'Dissabte'],
]

export function dayName(code: string): string {
  return DAYS.find(([c]) => c === code)?.[1] ?? code
}

export function parseTimeRange(text: string): [number, number] | null {
  const matches = [...(text || '').matchAll(/(\d{1,2})[.:h](\d{2})/g)]
  if (matches.length < 2) return null
  const toMinutes = (m: RegExpMatchArray) => Number(m[1]) * 60 + Number(m[2])
  return [toMinutes(matches[0]), toMinutes(matches[1])]
}

export function timeRangesOverlap(a: string, b: string): boolean {
  const ra = parseTimeRange(a)
  const rb = parseTimeRange(b)
  if (!ra || !rb) return false
  return ra[0] < rb[1] && rb[0] < ra[1]
}
