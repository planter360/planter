import { createClient } from '@/lib/supabase/server'
import { sportName } from '@/lib/sports'
import { oneOf } from '@/lib/relations'
import { dayName, effectivePlace } from '@/lib/schedule'
import { formatDateTime } from '@/lib/format'
import { FamilyAbsenceToggle } from './family-absence-toggle'

type TeamJoin = { name: string; sport: string }

export async function FamiliaView({ clubId }: { clubId: string }) {
  const supabase = await createClient()

  const { data: kids } = await supabase
    .from('players')
    .select('id, full_name, team_id, teams(name, sport)')
    .eq('club_id', clubId)
    .order('full_name')

  if (!kids || kids.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Entrenaments</h1>
        <p className="mt-4 text-sm text-zinc-600">Encara no hi ha cap jugador vinculat al teu compte.</p>
      </div>
    )
  }

  const teamIds = [...new Set(kids.map((k) => k.team_id).filter((id): id is string => Boolean(id)))]

  const { data: trainings } = teamIds.length
    ? await supabase
        .from('trainings')
        .select('team_id, days, time_txt, place, rain_place, rain_active')
        .in('team_id', teamIds)
    : {
        data: [] as {
          team_id: string
          days: string[]
          time_txt: string
          place: string
          rain_place: string | null
          rain_active: boolean
        }[],
      }

  const { data: sessions } = teamIds.length
    ? await supabase
        .from('sessions')
        .select('id, team_id, starts_at, place, focus')
        .in('team_id', teamIds)
        .gte('starts_at', new Date().toISOString())
        .order('starts_at', { ascending: true })
    : { data: [] as { id: string; team_id: string; starts_at: string; place: string | null; focus: string | null }[] }

  const sessionIds = (sessions ?? []).map((s) => s.id)
  const { data: attendanceRows } = sessionIds.length
    ? await supabase
        .from('attendance')
        .select('session_id, player_id, family_notified')
        .in('session_id', sessionIds)
        .in(
          'player_id',
          kids.map((k) => k.id)
        )
    : { data: [] as { session_id: string; player_id: string; family_notified: boolean }[] }

  const notifiedKey = (sessionId: string, playerId: string) => `${sessionId}_${playerId}`
  const notifiedMap = new Map(
    (attendanceRows ?? []).map((r) => [notifiedKey(r.session_id, r.player_id), r.family_notified])
  )

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900">Entrenaments</h1>
      <p className="mt-1 text-sm text-zinc-600">Horaris i pròximes sessions dels teus fills.</p>

      <div className="mt-6 space-y-8">
        {kids.map((kid) => {
          const team = oneOf(kid.teams as TeamJoin | TeamJoin[] | null)
          const training = (trainings ?? []).find((t) => t.team_id === kid.team_id)
          const kidSessions = (sessions ?? []).filter((s) => s.team_id === kid.team_id)

          return (
            <section key={kid.id}>
              <h2 className="text-lg font-bold text-zinc-900">{kid.full_name}</h2>
              <p className="text-xs text-zinc-500">
                {team?.name ?? 'Sense equip'} {team ? `· ${sportName(team.sport)}` : ''}
              </p>

              {training ? (
                <p className="mt-2 text-sm text-zinc-600">
                  {(training.days as string[]).map(dayName).join(', ')} · {training.time_txt} · {effectivePlace(training)}
                  {training.rain_active && <span className="ml-1 text-xs font-semibold text-blue-700">(pla de pluja)</span>}
                </p>
              ) : (
                <p className="mt-2 text-sm text-zinc-600">Encara no hi ha horari setmanal definit.</p>
              )}

              <div className="mt-3 space-y-2">
                {kidSessions.length === 0 && <p className="text-sm text-zinc-600">Cap sessió programada de moment.</p>}
                {kidSessions.map((s) => {
                  const notified = notifiedMap.get(notifiedKey(s.id, kid.id)) ?? false
                  return (
                    <div
                      key={s.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3"
                    >
                      <div>
                        <div className="text-sm font-semibold text-zinc-900">{formatDateTime(s.starts_at)}</div>
                        <div className="text-xs text-zinc-500">
                          {s.place ?? 'Lloc per confirmar'}
                          {s.focus ? ` · ${s.focus}` : ''}
                        </div>
                      </div>
                      <FamilyAbsenceToggle sessionId={s.id} playerId={kid.id} notified={notified} />
                    </div>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
