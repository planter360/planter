import { parseTimeRange } from '@/lib/schedule'

const TZ = 'Europe/Madrid'
const MATCH_MINUTES = 90

export const WEEK_DAYS: [code: string, label: string][] = [
  ['Dl', 'Dilluns'],
  ['Dt', 'Dimarts'],
  ['Dc', 'Dimecres'],
  ['Dj', 'Dijous'],
  ['Dv', 'Divendres'],
  ['Ds', 'Dissabte'],
  ['Dg', 'Diumenge'],
]

const WEEKDAY_INDEX: Record<string, number> = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 }

const partsFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
  weekday: 'short',
})

// Data, dia de la setmana (0 = dilluns) i minuts des de mitjanit, tot
// en hora de Madrid — el servidor de Vercel corre en UTC.
export function madridParts(date: Date): { date: string; weekday: number; minutes: number } {
  const p = Object.fromEntries(partsFormatter.formatToParts(date).map((x) => [x.type, x.value]))
  return {
    date: `${p.year}-${p.month}-${p.day}`,
    weekday: WEEKDAY_INDEX[p.weekday],
    minutes: Number(p.hour) * 60 + Number(p.minute),
  }
}

export function addDays(date: string, n: number): string {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10)
}

function daysBetween(from: string, to: string): number {
  const [y1, m1, d1] = from.split('-').map(Number)
  const [y2, m2, d2] = to.split('-').map(Number)
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86_400_000)
}

function weekStartOf(date: string): string {
  const [y, m, d] = date.split('-').map(Number)
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay()
  return addDays(date, -((dow + 6) % 7))
}

export function todayMadrid(): string {
  return madridParts(new Date()).date
}

export function resolveWeekStart(param: string | undefined): string {
  const valid = param && /^\d{4}-\d{2}-\d{2}$/.test(param)
  return weekStartOf(valid ? param : todayMadrid())
}

export function weekDayHeaders(weekStart: string): { label: string; date: string }[] {
  return WEEK_DAYS.map(([code], i) => {
    const date = addDays(weekStart, i)
    const [, m, d] = date.split('-')
    return { label: `${code} ${Number(d)}/${Number(m)}`, date }
  })
}

// Finestra ampla en UTC per consultar partits; després madridParts
// decideix si cada partit cau realment dins la setmana.
export function weekQueryRange(weekStart: string): { from: string; to: string } {
  return { from: `${addDays(weekStart, -1)}T00:00:00Z`, to: `${addDays(weekStart, 8)}T00:00:00Z` }
}

export interface CalEvent {
  id: string
  day: number
  start: number
  end: number
  title: string
  subtitle?: string
  href?: string
  kind: 'training' | 'match'
}

type EventMeta = Pick<CalEvent, 'title' | 'subtitle' | 'href'>

export function trainingEvents(t: { id: string; days: string[]; time_txt: string }, meta: EventMeta): CalEvent[] {
  const range = parseTimeRange(t.time_txt)
  if (!range) return []
  return t.days
    .map((code) => WEEK_DAYS.findIndex(([c]) => c === code))
    .filter((day) => day >= 0)
    .map((day) => ({ id: `${t.id}-${day}`, day, start: range[0], end: range[1], kind: 'training' as const, ...meta }))
}

export function matchEvent(m: { id: string; starts_at: string }, weekStart: string, meta: EventMeta): CalEvent | null {
  const p = madridParts(new Date(m.starts_at))
  const day = daysBetween(weekStart, p.date)
  if (day < 0 || day > 6) return null
  return { id: m.id, day, start: p.minutes, end: Math.min(p.minutes + MATCH_MINUTES, 24 * 60), kind: 'match', ...meta }
}

export function formatMinutes(min: number): string {
  return `${Math.floor(min / 60)}:${String(min % 60).padStart(2, '0')}`
}
