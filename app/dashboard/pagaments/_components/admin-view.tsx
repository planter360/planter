import { createClient } from '@/lib/supabase/server'
import { oneOf } from '@/lib/relations'
import { formatEuros } from '@/lib/money'
import { isOverdue } from '@/lib/receipts'
import { StatusTag } from './status-tag'
import { NewReceiptForm, type PlayerOption } from './new-receipt-form'
import { ReceiptActions } from './receipt-actions'
import { StatusFilterCards, totalsByStatus, type StatusFilter } from './status-filter'

type TeamJoin = { name: string }
type PlayerJoin = { full_name: string; teams: TeamJoin | TeamJoin[] | null }

export async function AdminPagamentsView({ clubId, estat }: { clubId: string; estat: StatusFilter | null }) {
  const supabase = await createClient()

  const { data: receipts } = await supabase
    .from('receipts')
    .select('id, concept, amount_cents, due_date, status, players(full_name, teams(name))')
    .eq('club_id', clubId)
    .order('due_date', { ascending: true })

  const { data: players } = await supabase
    .from('players')
    .select('id, full_name, teams(name)')
    .eq('club_id', clubId)
    .order('full_name')

  const rows = (receipts ?? []).map((r) => {
    const player = oneOf(r.players as PlayerJoin | PlayerJoin[] | null)
    const team = player ? oneOf(player.teams) : null
    return {
      id: r.id,
      concept: r.concept,
      amount_cents: r.amount_cents,
      due_date: r.due_date,
      status: r.status,
      player_name: player?.full_name ?? '(jugador donat de baixa)',
      team_name: team?.name ?? '—',
    }
  })

  const totals = totalsByStatus(rows)
  const visibleRows = estat ? rows.filter((r) => r.status === estat) : rows

  const playerOptions: PlayerOption[] = (players ?? []).map((p) => ({
    id: p.id,
    full_name: p.full_name,
    team_name: oneOf(p.teams as TeamJoin | TeamJoin[] | null)?.name ?? '—',
  }))

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Pagaments</h1>
          <p className="mt-1 text-sm text-zinc-600">Tots els rebuts del club.</p>
        </div>
        <NewReceiptForm players={playerOptions} />
      </div>

      <StatusFilterCards totals={totals} active={estat} />

      <div className="mt-6 overflow-x-auto rounded-2xl border border-zinc-200 bg-white">
        <table className="w-full text-sm" style={{ minWidth: 680 }}>
          <thead>
            <tr className="text-left text-xs uppercase text-zinc-500">
              <th className="px-5 py-3">Jugador</th>
              <th className="px-3 py-3">Equip</th>
              <th className="px-3 py-3">Concepte</th>
              <th className="px-3 py-3 text-right">Import</th>
              <th className="px-3 py-3">Venciment</th>
              <th className="px-3 py-3">Estat</th>
              <th className="px-3 py-3" />
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((r) => (
              <tr key={r.id} className="border-t border-zinc-100">
                <td className="px-5 py-3 font-medium text-zinc-900">{r.player_name}</td>
                <td className="px-3 py-3 text-zinc-600">{r.team_name}</td>
                <td className="px-3 py-3 text-zinc-600">{r.concept}</td>
                <td className="px-3 py-3 text-right font-semibold text-zinc-900">{formatEuros(r.amount_cents)}</td>
                <td className="px-3 py-3 text-zinc-600">{r.due_date}</td>
                <td className="px-3 py-3">
                  <StatusTag status={r.status} />
                </td>
                <td className="px-3 py-3">
                  <ReceiptActions receiptId={r.id} status={r.status} overdue={isOverdue(r.status, r.due_date)} />
                </td>
              </tr>
            ))}
            {visibleRows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-6 text-sm text-zinc-600">
                  {estat ? 'Cap rebut amb aquest estat.' : 'Encara no hi ha cap rebut emès.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
