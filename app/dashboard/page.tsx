import Link from 'next/link'
import { getSession } from '@/lib/membership'
import { createClient } from '@/lib/supabase/server'
import { ROLE_LABELS } from '@/lib/access'
import { effectivePlace } from '@/lib/schedule'
import {
  matchEvent,
  resolveWeekStart,
  trainingEvents,
  weekDayHeaders,
  weekQueryRange,
  type CalEvent,
} from '@/lib/calendar'
import { WeekCalendar, WeekNav } from './_components/week-calendar'

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ week?: string }> }) {
  const { user, active } = await getSession()
  if (!active) return null

  const supabase = await createClient()

  const { count: playersCount } = await supabase
    .from('players')
    .select('id', { count: 'exact', head: true })
    .eq('club_id', active.clubId)

  const { count: teamsCount } = await supabase
    .from('teams')
    .select('id', { count: 'exact', head: true })
    .eq('club_id', active.clubId)

  let kids: { id: string; full_name: string }[] = []
  if (active.role === 'familia') {
    const { data } = await supabase
      .from('players')
      .select('id, full_name')
      .eq('club_id', active.clubId)
      .order('full_name')
    kids = data ?? []
  }

  const { week } = await searchParams
  const weekStart = resolveWeekStart(week)

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900">Visió 360</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Hola, {user.email} · {ROLE_LABELS[active.role]} a {active.clubName}
      </p>

      {active.role !== 'familia' && (
        <div className="mt-6 flex flex-wrap gap-4">
          <StatCard
            label={active.role === 'entrenador' ? 'Jugadors del teu equip' : 'Jugadors'}
            value={playersCount ?? 0}
            href="/dashboard/plantilles"
          />
          {(active.role === 'admin' || active.role === 'coordinador') && (
            <StatCard
              label={active.role === 'coordinador' ? 'Equips de la teva secció' : 'Equips'}
              value={teamsCount ?? 0}
              href="/dashboard/plantilles"
            />
          )}
        </div>
      )}

      {active.role === 'entrenador' && <CoachWeek clubId={active.clubId} userId={user.id} weekStart={weekStart} />}

      {active.role === 'familia' && (
        <div className="mt-6">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Els teus fills</h2>
          {kids.length === 0 ? (
            <p className="mt-2 text-sm text-zinc-600">
              Encara no hi ha cap jugador vinculat al teu compte. Demana a l&apos;administrador del club que et hi vinculi.
            </p>
          ) : (
            <ul className="mt-2 space-y-2">
              {kids.map((k) => (
                <li key={k.id}>
                  <Link
                    href={`/dashboard/plantilles/jugador/${k.id}`}
                    className="block rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-900 hover:border-emerald-300"
                  >
                    {k.full_name}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

async function CoachWeek({ clubId, userId, weekStart }: { clubId: string; userId: string; weekStart: string }) {
  const supabase = await createClient()

  const { data: staffRows } = await supabase.from('team_staff').select('team_id').eq('user_id', userId)
  const teamIds = (staffRows ?? []).map((r) => r.team_id)
  if (teamIds.length === 0) {
    return <p className="mt-8 text-sm text-zinc-600">Encara no tens cap equip assignat.</p>
  }

  const { data: teams } = await supabase
    .from('teams')
    .select('id, name')
    .in('id', teamIds)
    .eq('club_id', clubId)
    .order('name')
  const teamName = new Map((teams ?? []).map((t) => [t.id, t.name]))

  const { data: trainings } = await supabase
    .from('trainings')
    .select('id, team_id, days, time_txt, place, rain_place, rain_active')
    .in('team_id', teamIds)

  const range = weekQueryRange(weekStart)
  const { data: matches } = await supabase
    .from('matches')
    .select('id, team_id, rival, starts_at, place')
    .in('team_id', teamIds)
    .gte('starts_at', range.from)
    .lt('starts_at', range.to)

  const { data: players } = await supabase
    .from('players')
    .select('id, full_name, dorsal, team_id')
    .in('team_id', teamIds)
    .order('dorsal', { ascending: true, nullsFirst: false })

  const multiTeam = teamIds.length > 1
  const events: CalEvent[] = [
    ...(trainings ?? []).flatMap((t) =>
      trainingEvents(
        { id: t.id, days: (t.days ?? []) as string[], time_txt: t.time_txt },
        {
          title: multiTeam ? `Entrenament · ${teamName.get(t.team_id) ?? ''}` : 'Entrenament',
          subtitle: effectivePlace(t),
          href: '/dashboard/entrenaments',
        }
      )
    ),
    ...(matches ?? [])
      .filter((m) => m.starts_at)
      .map((m) =>
        matchEvent({ id: m.id, starts_at: m.starts_at as string }, weekStart, {
          title: `vs ${m.rival}`,
          subtitle: multiTeam ? teamName.get(m.team_id) : (m.place ?? undefined),
          href: '/dashboard/partits',
        })
      )
      .filter((e): e is CalEvent => e !== null),
  ]

  return (
    <>
      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-zinc-900">La teva setmana</h2>
        <WeekNav weekStart={weekStart} hrefFor={(w) => `/dashboard?week=${w}`} />
      </div>
      <div className="mt-3">
        <WeekCalendar days={weekDayHeaders(weekStart)} events={events} />
      </div>

      <h2 className="mt-10 text-lg font-bold text-zinc-900">Els teus jugadors</h2>
      {(teams ?? []).map((team) => {
        const squad = (players ?? []).filter((p) => p.team_id === team.id)
        return (
          <section key={team.id} className="mt-4">
            {multiTeam && <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">{team.name}</h3>}
            {squad.length === 0 && <p className="mt-2 text-sm text-zinc-600">Encara no hi ha jugadors en aquest equip.</p>}
            <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {squad.map((p) => (
                <Link
                  key={p.id}
                  href={`/dashboard/plantilles/jugador/${p.id}`}
                  className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-3 py-2 hover:border-emerald-300"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-xs font-bold text-white">
                    {p.dorsal ?? '–'}
                  </span>
                  <span className="text-sm font-medium text-zinc-900">{p.full_name}</span>
                </Link>
              ))}
            </div>
          </section>
        )
      })}
    </>
  )
}

function StatCard({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link href={href} className="min-w-40 flex-1 rounded-2xl border border-zinc-200 bg-white p-5 hover:border-emerald-300">
      <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{label}</div>
      <div className="mt-1 text-4xl font-bold text-zinc-900">{value}</div>
    </Link>
  )
}
