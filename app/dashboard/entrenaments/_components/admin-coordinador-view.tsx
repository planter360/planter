import { createClient } from '@/lib/supabase/server'
import { oneOf } from '@/lib/relations'
import { sportName } from '@/lib/sports'
import { effectivePlace } from '@/lib/schedule'
import type { Role } from '@/lib/access'
import { ScheduleTabs } from './schedule-tabs'
import { HorarisList, type TrainingRow } from './horaris-list'
import { OccupancyGrid } from './occupancy-grid'

export async function AdminCoordinadorView({
  clubId,
  role,
  section,
}: {
  clubId: string
  role: Role
  section: string | null
}) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('trainings')
    .select('id, days, time_txt, place, rain_place, rain_active, teams(name, sport)')
    .eq('club_id', clubId)

  const all: TrainingRow[] = (data ?? []).map((t) => {
    const team = oneOf(t.teams as { name: string; sport: string } | { name: string; sport: string }[] | null)
    return {
      id: t.id,
      team_name: team?.name ?? '—',
      sport: team?.sport ?? '',
      days: (t.days ?? []) as string[],
      time_txt: t.time_txt,
      place: effectivePlace(t),
      rainActive: t.rain_active,
    }
  })

  const filtered = role === 'coordinador' ? all.filter((t) => t.sport === section) : all

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900">Entrenaments</h1>
      <p className="mt-1 text-sm text-zinc-600">
        {role === 'admin'
          ? "Horaris de tots els equips i graella d'ocupació d'instal·lacions."
          : `Horaris de la secció ${sportName(section ?? '')} i graella d'ocupació de totes les instal·lacions del club.`}
      </p>
      <div className="mt-6">
        <ScheduleTabs horaris={<HorarisList trainings={filtered} />} ocupacio={<OccupancyGrid trainings={all} />} />
      </div>
    </div>
  )
}
