import { createClient } from '@/lib/supabase/server'
import { sportName } from '@/lib/sports'

const STATUS_LABEL: Record<string, string> = { pagat: 'Al dia', pendent: 'Pendent', vencut: 'Vençut' }
const STATUS_TONE: Record<string, string> = {
  pagat: 'bg-emerald-50 text-emerald-700',
  pendent: 'bg-amber-50 text-amber-800',
  vencut: 'bg-red-50 text-red-700',
}

export async function EntrenadorPagamentsView({ userId }: { userId: string }) {
  const supabase = await createClient()

  const { data: staffRows } = await supabase.from('team_staff').select('team_id').eq('user_id', userId)
  const teamIds = (staffRows ?? []).map((r) => r.team_id)

  if (teamIds.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Pagaments</h1>
        <p className="mt-4 text-sm text-zinc-600">Encara no tens cap equip assignat.</p>
      </div>
    )
  }

  const { data: teams } = await supabase.from('teams').select('id, name, sport').in('id', teamIds).order('name')

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900">Pagaments</h1>
      <p className="mt-1 text-sm text-zinc-600">Veus només si cada jugador està al dia, sense imports ni dades bancàries.</p>
      <div className="mt-6 space-y-8">
        {(teams ?? []).map((team) => (
          <TeamPaymentStatus key={team.id} team={team} />
        ))}
      </div>
    </div>
  )
}

async function TeamPaymentStatus({ team }: { team: { id: string; name: string; sport: string } }) {
  const supabase = await createClient()

  const { data: squad } = await supabase
    .from('players')
    .select('id, full_name')
    .eq('team_id', team.id)
    .order('full_name')

  const { data: statusRows } = await supabase.rpc('team_payment_status', { p_team: team.id })
  const statusMap = new Map(
    ((statusRows ?? []) as { player_id: string; status: string }[]).map((r) => [r.player_id, r.status])
  )

  return (
    <section>
      <h2 className="text-lg font-bold text-zinc-900">{team.name}</h2>
      <p className="text-xs text-zinc-500">{sportName(team.sport)}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {(squad ?? []).map((p) => {
          const status = statusMap.get(p.id) ?? 'pagat'
          return (
            <span
              key={p.id}
              className={'rounded-full px-3 py-1 text-xs font-semibold ' + (STATUS_TONE[status] ?? STATUS_TONE.pagat)}
            >
              {p.full_name} · {STATUS_LABEL[status] ?? status}
            </span>
          )
        })}
        {(!squad || squad.length === 0) && <p className="text-sm text-zinc-600">Encara no hi ha jugadors en aquest equip.</p>}
      </div>
    </section>
  )
}
