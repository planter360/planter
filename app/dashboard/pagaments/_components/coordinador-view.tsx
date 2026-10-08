import { createClient } from '@/lib/supabase/server'
import { oneOf } from '@/lib/relations'
import { formatEuros } from '@/lib/money'
import { sportName } from '@/lib/sports'
import { StatusTag } from './status-tag'
import { StatusFilterCards, totalsByStatus, type StatusFilter } from './status-filter'

type TeamJoin = { name: string; sport: string }
type PlayerJoin = { full_name: string; teams: TeamJoin | TeamJoin[] | null }

export async function CoordinadorPagamentsView({
  clubId,
  section,
  estat,
}: {
  clubId: string
  section: string | null
  estat: StatusFilter | null
}) {
  const supabase = await createClient()

  const { data: receipts } = await supabase
    .from('receipts')
    .select('id, concept, amount_cents, due_date, status, players(full_name, teams(name, sport))')
    .eq('club_id', clubId)
    .order('due_date', { ascending: true })

  const rows = (receipts ?? [])
    .map((r) => {
      const player = oneOf(r.players as PlayerJoin | PlayerJoin[] | null)
      const team = player ? oneOf(player.teams) : null
      return {
        id: r.id,
        concept: r.concept,
        amount_cents: r.amount_cents,
        due_date: r.due_date,
        status: r.status,
        player_name: player?.full_name ?? '—',
        team_name: team?.name ?? '—',
        sport: team?.sport ?? '',
      }
    })
    .filter((r) => r.sport === section)

  const totals = totalsByStatus(rows)
  const visibleRows = estat ? rows.filter((r) => r.status === estat) : rows

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900">Pagaments</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Estat de cobrament de la secció {sportName(section ?? '')} (lectura, sense dades bancàries).
      </p>

      <StatusFilterCards totals={totals} active={estat} />

      <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white">
        {visibleRows.length === 0 && (
          <div className="px-5 py-6 text-sm text-zinc-600">
            {estat ? 'Cap rebut amb aquest estat.' : 'No hi ha rebuts en aquesta secció.'}
          </div>
        )}
        {visibleRows.map((r, i) => (
          <div
            key={r.id}
            className={'flex flex-wrap items-center gap-3 px-5 py-3 ' + (i ? 'border-t border-zinc-100' : '')}
          >
            <span className="w-40 font-medium text-zinc-900">{r.player_name}</span>
            <span className="w-32 text-sm text-zinc-600">{r.team_name}</span>
            <span className="min-w-40 flex-1 text-sm text-zinc-600">{r.concept}</span>
            <span className="w-24 text-right text-sm font-semibold text-zinc-900">{formatEuros(r.amount_cents)}</span>
            <StatusTag status={r.status} />
          </div>
        ))}
      </div>
    </div>
  )
}
