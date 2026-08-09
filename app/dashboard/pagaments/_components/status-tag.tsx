const STYLES: Record<string, string> = {
  pagat: 'bg-emerald-50 text-emerald-700',
  pendent: 'bg-amber-50 text-amber-800',
  vencut: 'bg-red-50 text-red-700',
  anullat: 'bg-zinc-100 text-zinc-500',
}

const LABELS: Record<string, string> = {
  pagat: 'Pagat',
  pendent: 'Pendent',
  vencut: 'Vençut',
  anullat: 'Anul·lat',
}

export function StatusTag({ status }: { status: string }) {
  return (
    <span className={'shrink-0 rounded-full px-3 py-1 text-xs font-semibold ' + (STYLES[status] ?? STYLES.anullat)}>
      {LABELS[status] ?? status}
    </span>
  )
}
