import { getSession } from '@/lib/membership'
import { createClient } from '@/lib/supabase/server'
import { ROLE_LABELS } from '@/lib/access'

export default async function DashboardPage() {
  const { user, active } = await getSession()
  if (!active) return null

  const supabase = await createClient()

  const { count: playersCount } = await supabase
    .from('players')
    .select('id', { count: 'exact', head: true })
    .eq('club_id', active.clubId)

  const { count: teamsCount } = await supabase
    .from('teams')
    .select('id', { count: 'exact', head: true })
    .eq('club_id', active.clubId)

  let kids: { id: string; full_name: string }[] = []
  if (active.role === 'familia') {
    const { data } = await supabase
      .from('players')
      .select('id, full_name')
      .eq('club_id', active.clubId)
      .order('full_name')
    kids = data ?? []
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900">Visió 360</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Hola, {user.email} · {ROLE_LABELS[active.role]} a {active.clubName}
      </p>

      {active.role !== 'familia' && (
        <div className="mt-6 flex flex-wrap gap-4">
          <StatCard
            label={active.role === 'entrenador' ? 'Jugadors del teu equip' : 'Jugadors'}
            value={playersCount ?? 0}
          />
          {(active.role === 'admin' || active.role === 'coordinador') && (
            <StatCard
              label={active.role === 'coordinador' ? 'Equips de la teva secció' : 'Equips'}
              value={teamsCount ?? 0}
            />
          )}
        </div>
      )}

      {active.role === 'familia' && (
        <div className="mt-6">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Els teus fills</h2>
          {kids.length === 0 ? (
            <p className="mt-2 text-sm text-zinc-600">
              Encara no hi ha cap jugador vinculat al teu compte. Demana a l&apos;administrador del club que et hi vinculi.
            </p>
          ) : (
            <ul className="mt-2 space-y-2">
              {kids.map((k) => (
                <li key={k.id} className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-900">
                  {k.full_name}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-40 flex-1 rounded-2xl border border-zinc-200 bg-white p-5">
      <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{label}</div>
      <div className="mt-1 text-4xl font-bold text-zinc-900">{value}</div>
    </div>
  )
}
