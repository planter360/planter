import { createClient } from '@/lib/supabase/server'
import { oneOf } from '@/lib/relations'

export interface SquadMember {
  id: string
  full_name: string
  dorsal: number | null
}

// A team's squad for attendance/call-ups is its primary roster plus any
// player_teams links — players who also train here without this being
// their home team (e.g. a cadet pulled up to train with the juniors).
export async function getTeamSquad(teamId: string): Promise<SquadMember[]> {
  const supabase = await createClient()

  const { data: primary } = await supabase.from('players').select('id, full_name, dorsal').eq('team_id', teamId)

  const { data: secondaryLinks } = await supabase
    .from('player_teams')
    .select('players(id, full_name, dorsal)')
    .eq('team_id', teamId)

  const secondary = (secondaryLinks ?? [])
    .map((link) => oneOf(link.players as SquadMember | SquadMember[] | null))
    .filter((p): p is SquadMember => Boolean(p))

  const byId = new Map<string, SquadMember>()
  for (const p of [...(primary ?? []), ...secondary]) byId.set(p.id, p)

  return [...byId.values()].sort((a, b) => (a.dorsal ?? 999) - (b.dorsal ?? 999))
}
