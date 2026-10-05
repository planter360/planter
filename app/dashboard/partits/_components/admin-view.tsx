import { createClient } from '@/lib/supabase/server'
import { oneOf } from '@/lib/relations'
import { formatDateTime } from '@/lib/format'
import { MatchStatusTag } from './match-status-tag'
import { PlaceLink } from '../../_components/place-link'
import type { Installation } from '@/lib/installations'

type TeamJoin = { name: string; sport: string }

export async function AdminPartitsView({ clubId, installations }: { clubId: string; installations: Installation[] }) {
  const supabase = await createClient()

  const { data } = await supabase
    .from('matches')
    .select('id, rival, starts_at, place, place_address, status, result, teams(name, sport)')
    .eq('club_id', clubId)
    .order('starts_at', { ascending: true, nullsFirst: false })

  const rows = (data ?? []).map((m) => {
    const team = oneOf(m.teams as TeamJoin | TeamJoin[] | null)
    return { ...m, team_name: team?.name ?? '—' }
  })

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900">Partits</h1>
      <p className="mt-1 text-sm text-zinc-600">Calendari i resultats de tots els equips (lectura).</p>

      <div className="mt-6 space-y-3">
        {rows.length === 0 && <p className="text-sm text-zinc-600">Encara no hi ha cap partit programat.</p>}
        {rows.map((m) => (
          <div key={m.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white p-5">
            <div>
              <div className="font-semibold text-zinc-900">
                {m.team_name} vs {m.rival}
              </div>
              <div className="text-xs text-zinc-500">
                {m.starts_at ? formatDateTime(m.starts_at) : 'Data per confirmar'} ·{' '}
                <PlaceLink place={m.place} address={m.place_address} installations={installations} />
              </div>
            </div>
            {m.result ? (
              <span className="text-2xl font-bold text-emerald-700">{m.result}</span>
            ) : (
              <MatchStatusTag status={m.status} />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
