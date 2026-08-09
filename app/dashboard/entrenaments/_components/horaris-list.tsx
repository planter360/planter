import { dayName } from '@/lib/schedule'

export interface TrainingRow {
  id: string
  team_name: string
  sport: string
  days: string[]
  time_txt: string
  place: string
}

export function HorarisList({ trainings }: { trainings: TrainingRow[] }) {
  if (trainings.length === 0) {
    return <p className="text-sm text-zinc-600">Cap horari definit encara.</p>
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
      {trainings.map((t, i) => (
        <div
          key={t.id}
          className={'flex flex-wrap items-center gap-3 px-5 py-3 ' + (i ? 'border-t border-zinc-100' : '')}
        >
          <span className="w-40 font-semibold text-zinc-900">{t.team_name}</span>
          <span className="min-w-40 flex-1 text-sm text-zinc-600">{t.days.map(dayName).join(', ')}</span>
          <span className="text-sm font-medium text-zinc-900">{t.time_txt}</span>
          <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700">{t.place}</span>
        </div>
      ))}
    </div>
  )
}
