import { createClient } from '@/lib/supabase/server'
import { oneOf } from '@/lib/relations'
import { sportName } from '@/lib/sports'
import { formatDateTime } from '@/lib/format'
import { MatchStatusTag } from './match-status-tag'
import { ConfirmAvailability } from './confirm-availability'

type TeamJoin = { id: string; name: string; sport: string }

export async function FamiliaPartitsView({ clubId }: { clubId: string }) {
  const supabase = await createClient()

  const { data: kids } = await supabase
    .from('players')
    .select('id, full_name, team_id, teams(id, name, sport)')
    .eq('club_id', clubId)
    .order('full_name')

  if (!kids || kids.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Partits</h1>
        <p className="mt-4 text-sm text-zinc-600">Encara no hi ha cap jugador vinculat al teu compte.</p>
      </div>
    )
  }

  const teamIds = [...new Set(kids.map((k) => k.team_id).filter((id): id is string => Boolean(id)))]

  const { data: matches } = teamIds.length
    ? await supabase
        .from('matches')
        .select('id, team_id, rival, starts_at, place, status, result')
        .in('team_id', teamIds)
        .order('starts_at', { ascending: true, nullsFirst: false })
    : { data: [] as { id: string; team_id: string; rival: string; starts_at: string | null; place: string | null; status: string; result: string | null }[] }

  const matchIds = (matches ?? []).map((m) => m.id)
  const { data: callupRows } = matchIds.length
    ? await supabase
        .from('callups')
        .select('match_id, player_id, confirmed')
        .in('match_id', matchIds)
        .in(
          'player_id',
          kids.map((k) => k.id)
        )
    : { data: [] as { match_id: string; player_id: string; confirmed: boolean | null }[] }

  const callupKey = (matchId: string, playerId: string) => `${matchId}_${playerId}`
  const callupMap = new Map((callupRows ?? []).map((r) => [callupKey(r.match_id, r.player_id), r.confirmed]))
  const calledUpSet = new Set((callupRows ?? []).map((r) => callupKey(r.match_id, r.player_id)))

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900">Partits</h1>
      <p className="mt-1 text-sm text-zinc-600">Convocatòries, horaris i resultats dels partits dels teus fills.</p>

      <div className="mt-6 space-y-8">
        {kids.map((kid) => {
          const team = oneOf(kid.teams as TeamJoin | TeamJoin[] | null)
          const kidMatches = (matches ?? []).filter((m) => m.team_id === kid.team_id)

          return (
            <section key={kid.id}>
              <h2 className="text-lg font-bold text-zinc-900">{kid.full_name}</h2>
              <p className="text-xs text-zinc-500">
                {team?.name ?? 'Sense equip'} {team ? `· ${sportName(team.sport)}` : ''}
              </p>

              <div className="mt-3 space-y-3">
                {kidMatches.length === 0 && <p className="text-sm text-zinc-600">Cap partit programat de moment.</p>}
                {kidMatches.map((m) => {
                  const key = callupKey(m.id, kid.id)
                  const calledUp = calledUpSet.has(key)
                  const confirmed = callupMap.get(key) ?? null

                  return (
                    <div key={m.id} className="rounded-2xl border border-zinc-200 bg-white p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <div className="font-semibold text-zinc-900">vs {m.rival}</div>
                          <div className="text-xs text-zinc-500">
                            {m.starts_at ? formatDateTime(m.starts_at) : 'Data per confirmar'} · {m.place ?? 'Lloc per confirmar'}
                          </div>
                        </div>
                        {m.result ? (
                          <span className="text-2xl font-bold text-emerald-700">{m.result}</span>
                        ) : (
                          <MatchStatusTag status={m.status} />
                        )}
                      </div>
                      {!m.result && m.status === 'convocat' && (
                        <div className="mt-3">
                          {calledUp ? (
                            <ConfirmAvailability matchId={m.id} playerId={kid.id} confirmed={confirmed} />
                          ) : (
                            <p className="text-xs text-zinc-500">No ha estat convocat/da en aquest partit.</p>
                          )}
                        </div>
                      )}
                      {!m.result && m.status === 'convocatoria' && (
                        <p className="mt-3 text-xs text-zinc-500">Convocatòria pendent de publicar.</p>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
