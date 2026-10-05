import { createClient } from '@/lib/supabase/server'
import { oneOf } from '@/lib/relations'
import { formatDateTime } from '@/lib/format'
import { sportName } from '@/lib/sports'
import { MatchStatusTag } from './match-status-tag'
import { NewMatchForm } from './new-match-form'
import { ResultForm } from './result-form'
import { PlaceLink } from '../../_components/place-link'
import type { Installation } from '@/lib/installations'

type TeamJoin = { id: string; name: string; sport: string }

export async function CoordinadorPartitsView({
  clubId,
  section,
  installations,
}: {
  clubId: string
  section: string | null
  installations: Installation[]
}) {
  const supabase = await createClient()

  const { data: teams } = await supabase.from('teams').select('id, name, sport').eq('club_id', clubId).eq('sport', section ?? '')

  const { data } = await supabase
    .from('matches')
    .select('id, rival, starts_at, place, place_address, status, result, teams(id, name, sport)')
    .eq('club_id', clubId)
    .order('starts_at', { ascending: true, nullsFirst: false })

  const rows = (data ?? [])
    .map((m) => {
      const team = oneOf(m.teams as TeamJoin | TeamJoin[] | null)
      return { ...m, team_name: team?.name ?? '—', sport: team?.sport ?? '' }
    })
    .filter((m) => m.sport === section)

  const matchIds = rows.map((m) => m.id)
  const { data: callupRows } = matchIds.length
    ? await supabase.from('callups').select('match_id').in('match_id', matchIds)
    : { data: [] as { match_id: string }[] }
  const callupCount = new Map<string, number>()
  for (const c of callupRows ?? []) callupCount.set(c.match_id, (callupCount.get(c.match_id) ?? 0) + 1)

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Partits</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Calendari de la secció {sportName(section ?? '')}: crea partits i revisa convocatòries.
          </p>
        </div>
        <NewMatchForm teams={teams ?? []} installations={installations} />
      </div>

      <div className="mt-6 space-y-3">
        {rows.length === 0 && <p className="text-sm text-zinc-600">Encara no hi ha cap partit programat en aquesta secció.</p>}
        {rows.map((m) => (
          <div key={m.id} className="rounded-2xl border border-zinc-200 bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="font-semibold text-zinc-900">
                  {m.team_name} vs {m.rival}
                </div>
                <div className="text-xs text-zinc-500">
                  {m.starts_at ? formatDateTime(m.starts_at) : 'Data per confirmar'} ·{' '}
                  <PlaceLink place={m.place} address={m.place_address} installations={installations} />
                </div>
              </div>
              <div className="flex items-center gap-3">
                {m.result ? (
                  <span className="text-2xl font-bold text-emerald-700">{m.result}</span>
                ) : (
                  <MatchStatusTag status={m.status} />
                )}
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="text-xs text-zinc-500">{callupCount.get(m.id) ?? 0} convocats</span>
              <ResultForm matchId={m.id} status={m.status} result={m.result} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
