export const SPORTS = [
  { id: 'futbol', name: 'Futbol' },
  { id: 'basquet', name: 'Bàsquet' },
  { id: 'handbol', name: 'Handbol' },
  { id: 'volei', name: 'Vòlei' },
  { id: 'futsal', name: 'Futsal' },
  { id: 'hockey', name: 'Hockey' }
] as const

export type Sport = (typeof SPORTS)[number]['id']

export function sportName(id: string): string {
  return SPORTS.find((s) => s.id === id)?.name ?? id
}
