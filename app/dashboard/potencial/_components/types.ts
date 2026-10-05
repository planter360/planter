export interface Assessment {
  id: string
  player_id: string
  tec: number
  fis: number
  tac: number
  men: number
  notes: string | null
  created_at: string
}

export function avgScore(a: Assessment): number {
  return (a.tec + a.fis + a.tac + a.men) / 4
}

// Canvi percentual de la mitjana respecte a la valoració anterior.
// null si no hi ha una valoració prèvia amb què comparar.
export function pctChange(curr: Assessment, prev: Assessment | undefined): number | null {
  if (!prev) return null
  const prevAvg = avgScore(prev)
  if (prevAvg === 0) return null
  return ((avgScore(curr) - prevAvg) / prevAvg) * 100
}
