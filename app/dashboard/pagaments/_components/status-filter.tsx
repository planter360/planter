import Link from 'next/link'
import { formatEuros } from '@/lib/money'

export type StatusFilter = 'pagat' | 'pendent' | 'vencut'

export function parseStatusFilter(value: string | undefined): StatusFilter | null {
  return value === 'pagat' || value === 'pendent' || value === 'vencut' ? value : null
}

const CARDS: { status: StatusFilter; label: string; tone: string }[] = [
  { status: 'pagat', label: 'Cobrat', tone: 'text-emerald-700' },
  { status: 'pendent', label: 'Pendent', tone: 'text-amber-700' },
  { status: 'vencut', label: 'Vençut', tone: 'text-red-700' },
]

export function totalsByStatus(rows: { status: string; amount_cents: number }[]): Record<StatusFilter, number> {
  const totals = { pagat: 0, pendent: 0, vencut: 0 }
  for (const r of rows) if (r.status in totals) totals[r.status as StatusFilter] += r.amount_cents
  return totals
}

// Clicar una targeta filtra el llistat; tornar-la a clicar treu el filtre.
export function StatusFilterCards({ totals, active }: { totals: Record<StatusFilter, number>; active: StatusFilter | null }) {
  return (
    <div className="mt-6 flex flex-wrap gap-4">
      {CARDS.map((c) => {
        const selected = active === c.status
        return (
          <Link
            key={c.status}
            href={selected ? '/dashboard/pagaments' : `/dashboard/pagaments?estat=${c.status}`}
            aria-pressed={selected}
            className={
              'min-w-40 flex-1 rounded-2xl border bg-white p-5 transition ' +
              (selected ? 'border-zinc-900 ring-2 ring-zinc-900' : 'border-zinc-200 hover:border-zinc-400')
            }
          >
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-zinc-500">
              {c.label}
              {selected && <span className="normal-case tracking-normal text-zinc-700">Filtrant · treure ✕</span>}
            </div>
            <div className={'mt-1 text-3xl font-bold ' + c.tone}>{formatEuros(totals[c.status])}</div>
          </Link>
        )
      })}
    </div>
  )
}
