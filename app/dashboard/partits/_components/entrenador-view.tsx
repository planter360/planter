import { createClient } from '@/lib/supabase/server'
import { sportName } from '@/lib/sports'
import { formatDateTime } from '@/lib/format'
import { getTeamSquad } from '@/lib/squad'
import { MatchStatusTag } from './match-status-tag'
import { NewMatchForm } from './new-match-form'
import { ResultForm } from './result-form'
import { CallupsEditor } from './callups-editor'

export async function EntrenadorPartitsView({ clubId, userId }: { clubId: string; userId: string }) {
  const supabase = await createClient()

  const { data: staffRows } = await supabase.from('team_staff').select('team_id').eq('user_id', userId)
  const teamIds = (staffRows ?? []).map((r) => r.team_id)

  if (teamIds.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Partits</h1>
        <p className="mt-4 text-sm text-zinc-600">Encara no tens cap equip assignat.</p>
      </div>
    )
  }

  const { data: teams } = await supabase
    .from('teams')
    .select('id, name, sport')
    .in('id', teamIds)
    .eq('club_id', clubId)
    .order('name')

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Partits</h1>
          <p className="mt-1 text-sm text-zinc-600">Crees partits i fas les convocatòries del teu equip.</p>
        </div>
        <NewMatchForm teams={teams ?? []} />
      </div>
      <div className="mt-6 space-y-10">
        {(teams ?? []).map((team) => (
          <TeamMatches key={team.id} team={team} />
        ))}
      </div>
    </div>
  )
}

async function TeamMatches({ team }: { team: { id: string; name: string; sport: string } }) {
  const supabase = await createClient()

  const squad = await getTeamSquad(team.id)

  const { data: matches } = await supabase
    .from('matches')
    .select('id, rival, starts_at, place, status, result')
    .eq('team_id', team.id)
    .order('starts_at', { ascending: true, nullsFirst: false })

  const matchIds = (matches ?? []).map((m) => m.id)
  const { data: callupRows } = matchIds.length
    ? await supabase.from('callups').select('match_id, player_id').in('match_id', matchIds)
    : { data: [] as { match_id: string; player_id: string }[] }

  const calledUpByMatch = new Map<string, string[]>()
  for (const c of callupRows ?? []) {
    const list = calledUpByMatch.get(c.match_id) ?? []
    list.push(c.player_id)
    calledUpByMatch.set(c.match_id, list)
  }

  return (
    <section>
      <h2 className="text-lg font-bold text-zinc-900">{team.name}</h2>
      <p className="text-xs text-zinc-500">{sportName(team.sport)}</p>

      {(!matches || matches.length === 0) && (
        <p className="mt-3 text-sm text-zinc-600">Cap partit creat. Fes servir «+ Nou partit» per programar-ne un.</p>
      )}

      <div className="mt-3 space-y-3">
        {(matches ?? []).map((m) => (
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
            <div className="mt-3 flex items-center justify-between gap-3">
              <CallupsEditor matchId={m.id} squad={squad} calledUpIds={calledUpByMatch.get(m.id) ?? []} />
              <ResultForm matchId={m.id} status={m.status} result={m.result} />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
