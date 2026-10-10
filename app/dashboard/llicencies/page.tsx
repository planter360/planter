import { getSession } from '@/lib/membership'
import { accessFor, ROLE_LABELS, type Role } from '@/lib/access'
import { createClient } from '@/lib/supabase/server'
import { getClubBranding } from '@/lib/club'

// Valors de clubs.plan (check de la Setmana 1). Les condicions de cada
// pla de pagament encara s'han de definir.
const PLAN_LABELS: Record<string, { name: string; description: string }> = {
  pilot: { name: 'Pilot', description: 'Accés complet gratuït durant la fase pilot.' },
  starter: { name: 'Starter', description: '' },
  club: { name: 'Club', description: '' },
  elit: { name: 'Elit', description: '' },
}

export default async function LlicenciesPage() {
  const { active } = await getSession()
  if (!active) return null

  if (accessFor('llicencies', active.role) === null) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Llicències</h1>
        <p className="mt-4 text-sm text-zinc-600">No tens accés a aquest mòdul.</p>
      </div>
    )
  }

  const supabase = await createClient()
  const { plan } = await getClubBranding(active.clubId)

  const [{ count: players }, { count: teams }, { data: usage }] = await Promise.all([
    supabase.from('players').select('id', { count: 'exact', head: true }).eq('club_id', active.clubId),
    supabase.from('teams').select('id', { count: 'exact', head: true }).eq('club_id', active.clubId),
    supabase.rpc('club_usage', { p_club_id: active.clubId }),
  ])
  const byRole = new Map(((usage ?? []) as { role: Role; total: number }[]).map((u) => [u.role, Number(u.total)]))
  const planInfo = PLAN_LABELS[plan] ?? { name: plan, description: '' }

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900">Llicències</h1>
      <p className="mt-1 text-sm text-zinc-600">Pla contractat i ús actual del club.</p>

      <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5">
        <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Pla actual</div>
        <div className="mt-1 text-2xl font-bold text-zinc-900">{planInfo.name}</div>
        {planInfo.description && <p className="mt-1 text-sm text-zinc-600">{planInfo.description}</p>}
      </div>

      <h2 className="mt-8 text-xs font-semibold uppercase tracking-wide text-zinc-500">Ús</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Stat label="Jugadors" value={players ?? 0} />
        <Stat label="Equips" value={teams ?? 0} />
        {(['admin', 'coordinador', 'entrenador', 'familia'] as Role[]).map((r) => (
          <Stat key={r} label={`Usuaris · ${ROLE_LABELS[r]}`} value={byRole.get(r) ?? 0} />
        ))}
      </div>

      <h2 className="mt-8 text-xs font-semibold uppercase tracking-wide text-zinc-500">Factures</h2>
      <p className="mt-2 text-sm text-zinc-600">
        Durant la beta no hi ha cap cobrament. Les factures apareixeran aquí quan s&apos;activi la subscripció.
      </p>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{label}</div>
      <div className="mt-1 text-3xl font-bold text-zinc-900">{value}</div>
    </div>
  )
}
