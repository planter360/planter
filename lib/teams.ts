export const TEAM_GENDERS = [
  { id: 'masculi', name: 'Masculí' },
  { id: 'femeni', name: 'Femení' },
  { id: 'mixt', name: 'Mixt' },
] as const

export interface BulkPlayerRow {
  full_name: string
  dorsal: number | null
  position: string | null
  birth_year: number | null
}

export function genderName(id: string | null | undefined): string | null {
  return TEAM_GENDERS.find((g) => g.id === id)?.name ?? null
}
