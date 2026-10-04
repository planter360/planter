import { createClient } from '@/lib/supabase/server'
import { getTeamSquad } from '@/lib/squad'
import { sportName } from '@/lib/sports'
import type { Assessment } from './types'
import { PlayerPotencialCard } from './player-potencial-card'

export async function TeamPotencial({
  team,
  canWrite,
}: {
  team: { id: string; name: string; sport: string }
  canWrite: boolean
}) {
  const supabase = await createClient()
  const squad = await getTeamSquad(team.id)
  const playerIds = squad.map((p) => p.id)

  const { data: assessmentsData } = playerIds.length
    ? await supabase
        .from('assessments')
        .select('id, player_id, tec, fis, tac, men, notes, created_at')
        .in('player_id', playerIds)
        .order('created_at', { ascending: false })
    : { data: [] as Assessment[] }
  const assessments = (assessmentsData ?? []) as Assessment[]

  const byPlayer = new Map<string, Assessment[]>()
  for (const a of assessments) {
    const list = byPlayer.get(a.player_id) ?? []
    list.push(a)
    byPlayer.set(a.player_id, list)
  }

  return (
    <section>
      <h2 className="text-lg font-bold text-zinc-900">{team.name}</h2>
      <p className="text-xs text-zinc-500">{sportName(team.sport)}</p>

      {squad.length === 0 && <p className="mt-3 text-sm text-zinc-600">Encara no hi ha jugadors en aquest equip.</p>}

      <div className="mt-3 space-y-3">
        {squad.map((p) => (
          <PlayerPotencialCard key={p.id} player={p} assessments={byPlayer.get(p.id) ?? []} canWrite={canWrite} />
        ))}
      </div>
    </section>
  )
}
