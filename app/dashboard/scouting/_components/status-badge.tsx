const LABELS: Record<string, string> = {
  interessant: 'Interessant',
  a_seguir: 'A seguir',
  fitxat: 'Fitxat',
  descartat: 'Descartat',
}

const COLORS: Record<string, string> = {
  interessant: 'bg-emerald-100 text-emerald-800',
  a_seguir: 'bg-amber-100 text-amber-800',
  fitxat: 'bg-blue-100 text-blue-800',
  descartat: 'bg-zinc-200 text-zinc-600',
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${COLORS[status] ?? 'bg-zinc-100 text-zinc-600'}`}>
      {LABELS[status] ?? status}
    </span>
  )
}
