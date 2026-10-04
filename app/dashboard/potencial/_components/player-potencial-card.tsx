import type { SquadMember } from '@/lib/squad'
import type { Assessment } from './types'
import { AssessmentForm } from './assessment-form'

export function PlayerPotencialCard({
  player,
  assessments,
  canWrite,
}: {
  player: SquadMember
  assessments: Assessment[]
  canWrite: boolean
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4">
      <div className="font-semibold text-zinc-900">
        {player.dorsal ? `#${player.dorsal} ` : ''}
        {player.full_name}
      </div>

      <div className="mt-3 space-y-2">
        {assessments.length === 0 && <p className="text-sm text-zinc-500">Encara no hi ha cap valoració.</p>}
        {assessments.map((a) => (
          <div key={a.id} className="flex flex-wrap items-center gap-3 rounded-lg bg-zinc-50 px-3 py-2 text-xs">
            <span className="text-zinc-400">{new Date(a.created_at).toLocaleDateString('ca-ES')}</span>
            <span className="font-semibold text-zinc-700">T {a.tec}</span>
            <span className="font-semibold text-zinc-700">F {a.fis}</span>
            <span className="font-semibold text-zinc-700">Tà {a.tac}</span>
            <span className="font-semibold text-zinc-700">M {a.men}</span>
            {a.notes && <span className="text-zinc-600">· {a.notes}</span>}
          </div>
        ))}
      </div>

      {canWrite && <AssessmentForm playerId={player.id} />}
    </div>
  )
}
