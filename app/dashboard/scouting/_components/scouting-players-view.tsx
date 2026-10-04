import { createClient } from '@/lib/supabase/server'
import { oneOf } from '@/lib/relations'
import { sportName, SPORTS } from '@/lib/sports'
import type { Role } from '@/lib/access'
import { NewScoutedPlayerForm } from './new-scouted-player-form'
import { ObservationForm } from './observation-form'
import { StatusBadge } from './status-badge'

interface Observation {
  id: string
  scouted_player_id: string
  status: string
  notes: string | null
  observed_at: string | null
}

export async function ScoutingPlayersView({
  clubId,
  role,
  section,
  userId,
}: {
  clubId: string
  role: Role
  section: string | null
  userId: string
}) {
  const supabase = await createClient()

  let allowedSports: string[]
  if (role === 'admin') {
    allowedSports = SPORTS.map((s) => s.id)
  } else if (role === 'coordinador') {
    allowedSports = section ? [section] : []
  } else {
    const { data: staffRows } = await supabase.from('team_staff').select('teams(sport)').eq('user_id', userId)
    const sports = new Set(
      (staffRows ?? [])
        .map((r) => oneOf(r.teams as { sport: string } | { sport: string }[] | null)?.sport)
        .filter((s): s is string => Boolean(s))
    )
    allowedSports = [...sports]
  }

  // La llista es filtra per RLS, no per aquest query: cada rol només
  // rep les files de l'esport que li correspon, sense haver-ho de
  // replicar aquí.
  const { data: players } = await supabase
    .from('scouted_players')
    .select('id, sport, full_name, birth_year, position, current_club, notes, created_at')
    .eq('club_id', clubId)
    .order('created_at', { ascending: false })

  const playerIds = (players ?? []).map((p) => p.id)
  const { data: observationsData } = playerIds.length
    ? await supabase
        .from('scouting_observations')
        .select('id, scouted_player_id, status, notes, observed_at')
        .in('scouted_player_id', playerIds)
        .order('observed_at', { ascending: false, nullsFirst: false })
    : { data: [] as Observation[] }
  const observations = (observationsData ?? []) as Observation[]

  const obsByPlayer = new Map<string, Observation[]>()
  for (const o of observations) {
    const list = obsByPlayer.get(o.scouted_player_id) ?? []
    list.push(o)
    obsByPlayer.set(o.scouted_player_id, list)
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-end gap-3">
        {allowedSports.length > 0 ? (
          <NewScoutedPlayerForm sports={allowedSports} />
        ) : (
          <p className="text-xs text-zinc-500">Encara no tens cap equip assignat.</p>
        )}
      </div>

      <div className="mt-4 space-y-4">
        {(!players || players.length === 0) && (
          <p className="text-sm text-zinc-600">Encara no hi ha cap jugador vigilat.</p>
        )}
        {(players ?? []).map((p) => (
          <div key={p.id} className="rounded-2xl border border-zinc-200 bg-white p-5">
            <div>
              <div className="font-semibold text-zinc-900">{p.full_name}</div>
              <div className="text-xs text-zinc-500">
                {sportName(p.sport)} · {p.position ?? 'Sense posició'} · {p.birth_year ?? '—'}
                {p.current_club ? ` · ${p.current_club}` : ''}
              </div>
              {p.notes && <p className="mt-2 text-sm text-zinc-700">{p.notes}</p>}
            </div>

            <div className="mt-4 space-y-2 border-t border-zinc-100 pt-3">
              {(obsByPlayer.get(p.id) ?? []).map((o) => (
                <div key={o.id} className="flex items-start gap-3 text-sm">
                  <StatusBadge status={o.status} />
                  <div className="flex-1">
                    {o.notes && <p className="text-zinc-700">{o.notes}</p>}
                    <p className="text-xs text-zinc-400">
                      {o.observed_at ? new Date(o.observed_at).toLocaleDateString('ca-ES') : 'Sense data'}
                    </p>
                  </div>
                </div>
              ))}
              <ObservationForm scoutedPlayerId={p.id} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
