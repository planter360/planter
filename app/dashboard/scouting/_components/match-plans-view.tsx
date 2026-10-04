import { createClient } from '@/lib/supabase/server'
import { oneOf } from '@/lib/relations'
import { formatDateTime } from '@/lib/format'
import { sportName } from '@/lib/sports'
import { MatchPlanEditor } from './match-plan-editor'

type TeamJoin = { name: string; sport: string }

interface Plan {
  id: string
  match_id: string
  content: string | null
  scouted_player_ids: string[]
}

export async function MatchPlansView({ clubId }: { clubId: string }) {
  const supabase = await createClient()

  // Igual que a la llista de jugadors: RLS ja restringeix "matches" a
  // la secció/equip que li pertoca a cadascú.
  const { data } = await supabase
    .from('matches')
    .select('id, rival, starts_at, teams(name, sport)')
    .eq('club_id', clubId)
    .order('starts_at', { ascending: true, nullsFirst: false })

  const rows = (data ?? []).map((m) => {
    const team = oneOf(m.teams as TeamJoin | TeamJoin[] | null)
    return { ...m, team_name: team?.name ?? '—', sport: team?.sport ?? '' }
  })

  const matchIds = rows.map((m) => m.id)
  const { data: plansData } = matchIds.length
    ? await supabase.from('match_plans').select('id, match_id, content, scouted_player_ids').in('match_id', matchIds)
    : { data: [] as Plan[] }
  const plans = (plansData ?? []) as Plan[]
  const planByMatch = new Map(plans.map((p) => [p.match_id, p]))

  const { data: scoutedPlayers } = await supabase.from('scouted_players').select('id, full_name, sport').eq('club_id', clubId)

  return (
    <div className="space-y-3">
      {rows.length === 0 && <p className="text-sm text-zinc-600">Encara no hi ha cap partit programat.</p>}
      {rows.map((m) => (
        <div key={m.id} className="rounded-2xl border border-zinc-200 bg-white p-5">
          <div className="font-semibold text-zinc-900">
            {m.team_name} vs {m.rival}
          </div>
          <div className="text-xs text-zinc-500">
            {m.starts_at ? formatDateTime(m.starts_at) : 'Data per confirmar'} · {sportName(m.sport)}
          </div>
          <MatchPlanEditor
            matchId={m.id}
            initialContent={planByMatch.get(m.id)?.content ?? ''}
            initialLinkedIds={planByMatch.get(m.id)?.scouted_player_ids ?? []}
            candidatePlayers={(scoutedPlayers ?? []).filter((p) => p.sport === m.sport)}
          />
        </div>
      ))}
    </div>
  )
}
