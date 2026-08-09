import { createClient } from '@/lib/supabase/server'
import { oneOf } from '@/lib/relations'
import { formatEuros } from '@/lib/money'
import { StatusTag } from './status-tag'

type TeamJoin = { name: string }
type PlayerJoin = { full_name: string; teams: TeamJoin | TeamJoin[] | null }

export async function FamiliaPagamentsView({ clubId }: { clubId: string }) {
  const supabase = await createClient()

  const { data: receipts } = await supabase
    .from('receipts')
    .select('id, concept, amount_cents, due_date, status, players(full_name, teams(name))')
    .eq('club_id', clubId)
    .order('due_date', { ascending: true })

  const rows = (receipts ?? []).map((r) => {
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
    }
  })

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900">Pagaments</h1>
      <p className="mt-1 text-sm text-zinc-600">Els rebuts dels teus fills.</p>

      <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white">
        {rows.length === 0 && <div className="px-5 py-6 text-sm text-zinc-600">No teniu cap rebut emès.</div>}
        {rows.map((r, i) => (
          <div
            key={r.id}
            className={'flex flex-wrap items-center gap-3 px-5 py-4 ' + (i ? 'border-t border-zinc-100' : '')}
          >
            <div className="min-w-48 flex-1">
              <div className="font-semibold text-zinc-900">{r.concept}</div>
              <div className="text-xs text-zinc-500">
                {r.player_name} · {r.team_name} · venciment {r.due_date}
              </div>
            </div>
            <span className="w-20 text-right text-lg font-bold text-zinc-900">{formatEuros(r.amount_cents)}</span>
            <StatusTag status={r.status} />
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-zinc-500">
        El pagament en línia (targeta / Bizum) estarà disponible properament des d&apos;aquí.
      </p>
    </div>
  )
}
