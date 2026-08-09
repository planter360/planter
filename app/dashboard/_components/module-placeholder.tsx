import { VIS_NOTE, ROLE_LABELS, type ModuleId, type Role } from '@/lib/access'

export function ModulePlaceholder({
  moduleId,
  role,
  title,
}: {
  moduleId: ModuleId
  role: Role
  title: string
}) {
  const note = VIS_NOTE[moduleId]?.[role]

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900">{title}</h1>
      {note && <p className="mt-1 text-sm text-zinc-600">{note}</p>}
      <div className="mt-6 rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center">
        <p className="text-sm text-zinc-600">Aquest mòdul encara està en construcció.</p>
        <p className="mt-1 text-xs text-zinc-400">Vista actual: {ROLE_LABELS[role]}</p>
      </div>
    </div>
  )
}
