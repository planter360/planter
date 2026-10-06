import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { oneOf } from '@/lib/relations'

type TeamJoin = { name: string }
type SummaryRow = { created_at: string; avg_score: number }

export async function FamiliaView({ clubId }: { clubId: string }) {
  const supabase = await createClient()

  const { data: kids } = await supabase
    .from('players')
    .select('id, full_name, teams(name)')
    .eq('club_id', clubId)
    .order('full_name')

  if (!kids || kids.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Potencial</h1>
        <p className="mt-4 text-sm text-zinc-600">Encara no hi ha cap jugador vinculat al teu compte.</p>
      </div>
    )
  }

  // La família no llegeix assessments directament: la funció només
  // retorna data + mitjana dels seus fills (sense notes ni desglossament).
  const summaries = await Promise.all(
    kids.map(async (k) => {
      const { data } = await supabase.rpc('guardian_assessment_summary', { p_player_id: k.id })
      return [k.id, ((data ?? []) as SummaryRow[]).map((r) => ({ ...r, avg_score: Number(r.avg_score) }))] as const
    })
  )
  const byKid = new Map(summaries)

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900">Potencial</h1>
      <p className="mt-1 text-sm text-zinc-600">Evolució global dels teus fills.</p>

      <div className="mt-6 space-y-4">
        {kids.map((k) => {
          const history = byKid.get(k.id) ?? []
          const team = oneOf(k.teams as TeamJoin | TeamJoin[] | null)
          const last = history[history.length - 1]
          const prev = history[history.length - 2]
          const change = last && prev && prev.avg_score ? ((last.avg_score - prev.avg_score) / prev.avg_score) * 100 : null

          return (
            <div key={k.id} className="rounded-2xl border border-zinc-200 bg-white p-5">
              <Link href={`/dashboard/plantilles/jugador/${k.id}`} className="font-semibold text-zinc-900 hover:underline">
                {k.full_name}
              </Link>
              <div className="text-xs text-zinc-500">{team?.name ?? '—'}</div>

              {!last ? (
                <p className="mt-3 text-sm text-zinc-600">Encara no hi ha cap valoració.</p>
              ) : (
                <div className="mt-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-emerald-700">{last.avg_score.toFixed(1)}</span>
                    <span className="text-sm text-zinc-500">/ 5</span>
                    {change !== null && (
                      <span
                        className={
                          'ml-2 text-sm font-semibold ' +
                          (change > 0 ? 'text-emerald-700' : change < 0 ? 'text-red-600' : 'text-zinc-500')
                        }
                      >
                        {change > 0 ? '↑ +' : change < 0 ? '↓ ' : '→ '}
                        {change.toFixed(0)}%
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-zinc-400">
                    {history.length} valoracions des de {new Date(history[0].created_at).toLocaleDateString('ca-ES')}
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
