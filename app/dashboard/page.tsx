import Link from 'next/link'
import { getSession } from '@/lib/membership'
import { createClient } from '@/lib/supabase/server'
import { ROLE_LABELS, type Role } from '@/lib/access'
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

const WEEK_TITLE: Record<Role, string> = {
  admin: 'Setmana del club',
  coordinador: 'Setmana de la secció',
  entrenador: 'La teva setmana',
  familia: 'Setmana dels teus fills',
}

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ week?: string }> }) {
  const { user, active } = await getSession()
  if (!active) return null

  const supabase = await createClient()

  const { count: playersCount } = await supabase
    .from('players')
    .select('id', { count: 'exact', head: true })
    .eq('club_id', active.clubId)

  let kids: { id: string; full_name: string; team_id: string | null }[] = []
  if (active.role === 'familia') {
    const { data } = await supabase
      .from('players')
      .select('id, full_name, team_id')
      .eq('club_id', active.clubId)
      .order('full_name')
    kids = data ?? []
  }

  const teamIds = await visibleTeamIds(active.role, active.clubId, active.section, user.id, kids)
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
            href="/dashboard/jugadors"
          />
          {(active.role === 'admin' || active.role === 'coordinador') && (
            <StatCard
              label={active.role === 'coordinador' ? 'Equips de la teva secció' : 'Equips'}
              value={teamIds.length}
              href="/dashboard/plantilles"
            />
          )}
        </div>
      )}

      {active.role === 'familia' && (
        <div className="mt-6">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Els teus fills</h2>
          {kids.length === 0 ? (
            <p className="mt-2 text-sm text-zinc-600">
              Encara no hi ha cap jugador vinculat al teu compte. Demana a l&apos;entrenador o al club que et hi vinculi.
            </p>
          ) : (
            <ul className="mt-2 grid gap-2 sm:grid-cols-2">
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

      {teamIds.length > 0 ? (
        <TeamsWeek clubId={active.clubId} teamIds={teamIds} weekStart={weekStart} title={WEEK_TITLE[active.role]} />
      ) : (
        active.role !== 'familia' && (
          <p className="mt-8 text-sm text-zinc-600">
            {active.role === 'entrenador' ? 'Encara no tens cap equip assignat.' : 'Encara no hi ha equips.'}
          </p>
        )
      )}
    </div>
  )
}

// Equips que entren al calendari de cada rol. La RLS ja limita què es
// pot llegir; això només decideix l'abast (secció, equip propi, fills).
async function visibleTeamIds(
  role: Role,
  clubId: string,
  section: string | null,
  userId: string,
  kids: { id: string; team_id: string | null }[]
): Promise<string[]> {
  const supabase = await createClient()

  if (role === 'entrenador') {
    const { data } = await supabase.from('team_staff').select('team_id').eq('user_id', userId)
    return (data ?? []).map((r) => r.team_id)
  }
  if (role === 'familia') {
    const primary = kids.map((k) => k.team_id).filter((id): id is string => Boolean(id))
    const { data: secondary } = kids.length
      ? await supabase.from('player_teams').select('team_id').in('player_id', kids.map((k) => k.id))
      : { data: [] as { team_id: string }[] }
    return [...new Set([...primary, ...(secondary ?? []).map((r) => r.team_id)])]
  }

  let query = supabase.from('teams').select('id').eq('club_id', clubId)
  if (role === 'coordinador') query = query.eq('sport', section ?? '')
  const { data } = await query
  return (data ?? []).map((t) => t.id)
}

async function TeamsWeek({
  clubId,
  teamIds,
  weekStart,
  title,
}: {
  clubId: string
  teamIds: string[]
  weekStart: string
  title: string
}) {
  const supabase = await createClient()

  const { data: teams } = await supabase.from('teams').select('id, name').in('id', teamIds).eq('club_id', clubId)
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

  const multiTeam = teamIds.length > 1
  const events: CalEvent[] = [
    ...(trainings ?? []).flatMap((t) =>
      trainingEvents(
        { id: t.id, days: (t.days ?? []) as string[], time_txt: t.time_txt },
        {
          title: multiTeam ? (teamName.get(t.team_id) ?? 'Entrenament') : 'Entrenament',
          subtitle: effectivePlace(t),
          href: '/dashboard/entrenaments',
        }
      )
    ),
    ...(matches ?? [])
      .filter((m) => m.starts_at)
      .map((m) =>
        matchEvent({ id: m.id, starts_at: m.starts_at as string }, weekStart, {
          title: multiTeam ? `${teamName.get(m.team_id) ?? ''} vs ${m.rival}` : `vs ${m.rival}`,
          subtitle: m.place ?? undefined,
          href: '/dashboard/partits',
        })
      )
      .filter((e): e is CalEvent => e !== null),
  ]

  return (
    <>
      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-zinc-900">{title}</h2>
        <WeekNav weekStart={weekStart} hrefFor={(w) => `/dashboard?week=${w}`} />
      </div>
      <div className="mt-3">
        <WeekCalendar days={weekDayHeaders(weekStart)} events={events} />
      </div>
    </>
  )
}

function StatCard({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link href={href} className="min-w-40 flex-1 rounded-2xl border border-zinc-200 bg-white p-5 hover:border-emerald-300">
      <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{label}</div>
      <div className="mt-1 text-4xl font-bold text-zinc-900">{value}</div>
      <div className="mt-1 text-xs font-semibold text-emerald-700">Veure llistat →</div>
    </Link>
  )
}
