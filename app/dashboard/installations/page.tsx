import Link from 'next/link'
import { getSession } from '@/lib/membership'
import { createClient } from '@/lib/supabase/server'
import { accessFor } from '@/lib/access'
import { oneOf } from '@/lib/relations'
import { getInstallations } from '@/lib/installations'
import { mapsSearchUrl } from '@/lib/maps'
import { effectivePlace } from '@/lib/schedule'
import {
  matchEvent,
  resolveWeekStart,
  trainingEvents,
  weekDayHeaders,
  weekQueryRange,
  type CalEvent,
} from '@/lib/calendar'
import { WeekCalendar, WeekNav } from '../_components/week-calendar'
import { NewInstallationForm } from './_components/new-installation-form'
import { DeleteInstallationButton } from './_components/delete-installation-button'

type TeamJoin = { name: string }

export default async function InstallationsPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; week?: string }>
}) {
  const { active } = await getSession()
  if (!active) return null

  if (accessFor('installations', active.role) === null) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Instal·lacions</h1>
        <p className="mt-4 text-sm text-zinc-600">No tens accés a aquest mòdul.</p>
      </div>
    )
  }

  const { id, week } = await searchParams
  const installations = await getInstallations(active.clubId)
  const selected = installations.find((i) => i.id === id) ?? installations[0]
  const weekStart = resolveWeekStart(week)
  const hrefFor = (installationId: string, w: string) => `/dashboard/installations?id=${installationId}&week=${w}`

  let events: CalEvent[] = []
  if (selected) {
    const supabase = await createClient()

    const { data: trainings } = await supabase
      .from('trainings')
      .select('id, days, time_txt, place, rain_place, rain_active, teams(name)')
      .eq('club_id', active.clubId)

    const range = weekQueryRange(weekStart)
    const { data: matches } = await supabase
      .from('matches')
      .select('id, rival, starts_at, place, teams(name)')
      .eq('club_id', active.clubId)
      .eq('place', selected.name)
      .gte('starts_at', range.from)
      .lt('starts_at', range.to)

    events = [
      ...(trainings ?? [])
        .filter((t) => effectivePlace(t) === selected.name)
        .flatMap((t) =>
          trainingEvents(
            { id: t.id, days: (t.days ?? []) as string[], time_txt: t.time_txt },
            {
              title: oneOf(t.teams as TeamJoin | TeamJoin[] | null)?.name ?? 'Entrenament',
              subtitle: t.rain_active ? 'pla de pluja' : undefined,
              href: '/dashboard/entrenaments',
            }
          )
        ),
      ...(matches ?? [])
        .filter((m) => m.starts_at)
        .map((m) =>
          matchEvent({ id: m.id, starts_at: m.starts_at as string }, weekStart, {
            title: `${oneOf(m.teams as TeamJoin | TeamJoin[] | null)?.name ?? 'Partit'} vs ${m.rival}`,
            href: '/dashboard/partits',
          })
        )
        .filter((e): e is CalEvent => e !== null),
    ]
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Instal·lacions</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Ocupació setmanal de cada pista. El llistat també apareix com a desplegable a Entrenaments i Partits.
          </p>
        </div>
        <NewInstallationForm />
      </div>

      {installations.length === 0 ? (
        <p className="mt-6 text-sm text-zinc-600">Encara no hi ha cap instal·lació donada d&apos;alta.</p>
      ) : (
        <>
          <div className="mt-6 flex flex-wrap gap-2">
            {installations.map((i) => (
              <Link
                key={i.id}
                href={hrefFor(i.id, weekStart)}
                className={
                  'rounded-full px-3 py-1.5 text-sm font-semibold ' +
                  (i.id === selected?.id ? 'bg-zinc-900 text-white' : 'border border-zinc-300 text-zinc-700 hover:bg-zinc-100')
                }
              >
                {i.name}
              </Link>
            ))}
          </div>

          {selected && (
            <section className="mt-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-zinc-900">{selected.name}</h2>
                  {selected.address && (
                    <a
                      href={mapsSearchUrl(selected.address)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-brand-strong underline underline-offset-2"
                    >
                      {selected.address}
                    </a>
                  )}
                </div>
                <WeekNav weekStart={weekStart} hrefFor={(w) => hrefFor(selected.id, w)} />
              </div>
              <div className="mt-3">
                <WeekCalendar days={weekDayHeaders(weekStart)} events={events} highlightConflicts />
              </div>
            </section>
          )}

          <h2 className="mt-10 text-sm font-semibold uppercase tracking-wide text-zinc-500">Totes les instal·lacions</h2>
          <div className="mt-3 space-y-2">
            {installations.map((i) => (
              <div
                key={i.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white p-4"
              >
                <div>
                  <div className="font-semibold text-zinc-900">{i.name}</div>
                  {i.address && (
                    <a
                      href={mapsSearchUrl(i.address)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-brand-strong underline underline-offset-2"
                    >
                      {i.address}
                    </a>
                  )}
                </div>
                <DeleteInstallationButton id={i.id} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
