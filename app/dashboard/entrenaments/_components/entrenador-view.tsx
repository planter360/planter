import { createClient } from '@/lib/supabase/server'
import { sportName } from '@/lib/sports'
import { dayName, effectivePlace } from '@/lib/schedule'
import { getTeamSquad } from '@/lib/squad'
import { TrainingScheduleForm } from './training-schedule-form'
import { RainPlanToggle } from './rain-plan-toggle'
import { NewSessionForm } from './new-session-form'
import { SessionAttendanceCard } from './session-attendance-card'

export async function EntrenadorView({ clubId, userId }: { clubId: string; userId: string }) {
  const supabase = await createClient()

  const { data: staffRows } = await supabase.from('team_staff').select('team_id').eq('user_id', userId)
  const teamIds = (staffRows ?? []).map((r) => r.team_id)

  if (teamIds.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Entrenaments</h1>
        <p className="mt-4 text-sm text-zinc-600">
          Encara no tens cap equip assignat. Demana a coordinació que et hi vinculi.
        </p>
      </div>
    )
  }

  const { data: teams } = await supabase
    .from('teams')
    .select('id, name, sport')
    .in('id', teamIds)
    .eq('club_id', clubId)
    .order('name')

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900">Entrenaments</h1>
      <p className="mt-1 text-sm text-zinc-600">Horari setmanal, sessions i assistència del teu equip.</p>
      <div className="mt-6 space-y-10">
        {(teams ?? []).map((team) => (
          <TeamTrainingSection key={team.id} team={team} />
        ))}
      </div>
    </div>
  )
}

async function TeamTrainingSection({ team }: { team: { id: string; name: string; sport: string } }) {
  const supabase = await createClient()

  const { data: training } = await supabase
    .from('trainings')
    .select('id, days, time_txt, place, rain_place, rain_active')
    .eq('team_id', team.id)
    .maybeSingle()

  const squad = await getTeamSquad(team.id)

  const { data: sessions } = await supabase
    .from('sessions')
    .select('id, starts_at, place, focus')
    .eq('team_id', team.id)
    .order('starts_at', { ascending: true })

  const sessionIds = (sessions ?? []).map((s) => s.id)
  const { data: attendanceRows } = sessionIds.length
    ? await supabase.from('attendance').select('session_id, player_id, present').in('session_id', sessionIds)
    : { data: [] as { session_id: string; player_id: string; present: boolean | null }[] }

  const attendanceBySession = new Map<string, Record<string, boolean>>()
  for (const row of attendanceRows ?? []) {
    const map = attendanceBySession.get(row.session_id) ?? {}
    map[row.player_id] = row.present !== false
    attendanceBySession.set(row.session_id, map)
  }

  const trainingDays = (training?.days ?? []) as string[]

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-zinc-900">{team.name}</h2>
          <p className="text-xs text-zinc-500">{sportName(team.sport)}</p>
        </div>
        <TrainingScheduleForm
          teamId={team.id}
          initialDays={trainingDays}
          initialTime={training?.time_txt ?? ''}
          initialPlace={training?.place ?? ''}
          initialRainPlace={training?.rain_place ?? ''}
        />
      </div>

      {training && (
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <p className="text-sm text-zinc-600">
            {trainingDays.map(dayName).join(', ')} · {training.time_txt} · {effectivePlace(training)}
            {training.rain_active && <span className="ml-1 text-xs font-semibold text-blue-700">(pla de pluja)</span>}
          </p>
          <RainPlanToggle teamId={team.id} rainPlace={training.rain_place} rainActive={training.rain_active} />
        </div>
      )}

      <div className="mt-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Sessions i assistència</h3>
        <NewSessionForm teamId={team.id} />
      </div>

      {(!sessions || sessions.length === 0) && (
        <p className="mt-3 text-sm text-zinc-600">
          Cap sessió creada. Fes servir «+ Nova sessió» per planificar el pròxim entrenament.
        </p>
      )}

      <div className="mt-3 space-y-3">
        {(sessions ?? []).map((s) => (
          <SessionAttendanceCard
            key={s.id}
            session={s}
            squad={squad}
            attendance={attendanceBySession.get(s.id) ?? {}}
          />
        ))}
      </div>
    </section>
  )
}
