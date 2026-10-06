import Link from 'next/link'
import { addDays, formatMinutes, resolveWeekStart, todayMadrid, type CalEvent } from '@/lib/calendar'

const HOUR_PX = 44

interface PlacedEvent {
  event: CalEvent
  lane: number
  lanes: number
  conflict: boolean
}

// Esdeveniments que se solapen al mateix dia es posen en carrils
// paral·lels en comptes de tapar-se.
function layoutDay(events: CalEvent[]): PlacedEvent[] {
  const sorted = [...events].sort((a, b) => a.start - b.start || b.end - a.end)
  const laneEnds: number[] = []
  const placed = sorted.map((event) => {
    let lane = laneEnds.findIndex((end) => end <= event.start)
    if (lane === -1) {
      lane = laneEnds.length
      laneEnds.push(event.end)
    } else {
      laneEnds[lane] = event.end
    }
    return { event, lane }
  })
  const lanes = Math.max(1, laneEnds.length)
  return placed.map(({ event, lane }) => ({
    event,
    lane,
    lanes,
    conflict: sorted.some((o) => o !== event && o.start < event.end && event.start < o.end),
  }))
}

const KIND_STYLE: Record<CalEvent['kind'], string> = {
  training: 'border-emerald-300 bg-emerald-50 text-emerald-900',
  match: 'border-amber-300 bg-amber-50 text-amber-900',
}

export function WeekCalendar({
  days,
  events,
  highlightConflicts = false,
}: {
  days: { label: string; date: string }[]
  events: CalEvent[]
  highlightConflicts?: boolean
}) {
  const today = todayMadrid()
  const first = Math.floor(Math.min(8 * 60, ...events.map((e) => e.start)) / 60)
  const last = Math.ceil(Math.max(22 * 60, ...events.map((e) => e.end)) / 60)
  const hours = Array.from({ length: last - first }, (_, i) => first + i)
  const height = (last - first) * HOUR_PX

  return (
    <div>
      <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white">
        <div className="grid" style={{ gridTemplateColumns: '3rem repeat(7, minmax(6.5rem, 1fr))', minWidth: 780 }}>
          <div className="border-b border-zinc-200" />
          {days.map((d) => (
            <div
              key={d.date}
              className={
                'border-b border-l border-zinc-200 px-2 py-2 text-xs font-semibold uppercase ' +
                (d.date === today ? 'text-emerald-700' : 'text-zinc-500')
              }
            >
              {d.label}
            </div>
          ))}

          <div className="relative" style={{ height }}>
            {hours.map((h, i) => (
              <span key={h} className="absolute right-2 text-[10px] text-zinc-400" style={{ top: i * HOUR_PX - 6 }}>
                {i === 0 ? '' : `${h}:00`}
              </span>
            ))}
          </div>

          {days.map((d, dayIndex) => (
            <div
              key={d.date}
              className={'relative border-l border-zinc-200 ' + (d.date === today ? 'bg-emerald-50/30' : '')}
              style={{ height }}
            >
              {hours.map((h, i) => (
                <div key={h} className="absolute inset-x-0 border-t border-zinc-100" style={{ top: i * HOUR_PX }} />
              ))}
              {layoutDay(events.filter((e) => e.day === dayIndex)).map(({ event, lane, lanes, conflict }) => {
                const style = {
                  top: ((event.start - first * 60) / 60) * HOUR_PX,
                  height: Math.max(22, ((event.end - event.start) / 60) * HOUR_PX - 2),
                  left: `calc(${(lane * 100) / lanes}% + 2px)`,
                  width: `calc(${100 / lanes}% - 4px)`,
                }
                const className =
                  'absolute overflow-hidden rounded-lg border px-1.5 py-1 text-[11px] leading-tight ' +
                  (highlightConflicts && conflict ? 'border-red-400 bg-red-50 text-red-900' : KIND_STYLE[event.kind])
                const body = (
                  <>
                    <div className="font-semibold">{event.title}</div>
                    <div className="opacity-70">
                      {formatMinutes(event.start)}–{formatMinutes(event.end)}
                      {event.subtitle ? ` · ${event.subtitle}` : ''}
                    </div>
                  </>
                )
                return event.href ? (
                  <Link key={event.id} href={event.href} style={style} className={className + ' hover:shadow-md'}>
                    {body}
                  </Link>
                ) : (
                  <div key={event.id} style={style} className={className}>
                    {body}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-4 text-xs text-zinc-500">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded border border-emerald-300 bg-emerald-50" /> Entrenament
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded border border-amber-300 bg-amber-50" /> Partit
        </span>
        {highlightConflicts && (
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded border border-red-400 bg-red-50" /> Solapament
          </span>
        )}
      </div>
    </div>
  )
}

export function WeekNav({ weekStart, hrefFor }: { weekStart: string; hrefFor: (week: string) => string }) {
  const end = addDays(weekStart, 6)
  const fmt = (date: string) => {
    const [, m, d] = date.split('-')
    return `${Number(d)}/${Number(m)}`
  }
  const linkClass = 'rounded-lg border border-zinc-300 px-2.5 py-1 text-xs font-semibold text-zinc-700 hover:bg-zinc-100'

  return (
    <div className="flex items-center gap-2">
      <Link href={hrefFor(addDays(weekStart, -7))} className={linkClass} aria-label="Setmana anterior">
        ←
      </Link>
      <span className="min-w-28 text-center text-sm font-semibold text-zinc-700">
        {fmt(weekStart)} – {fmt(end)}
      </span>
      <Link href={hrefFor(addDays(weekStart, 7))} className={linkClass} aria-label="Setmana següent">
        →
      </Link>
      <Link href={hrefFor(resolveWeekStart(undefined))} className={linkClass}>
        Avui
      </Link>
    </div>
  )
}
