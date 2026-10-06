import Link from 'next/link'
import { getSession } from '@/lib/membership'
import { createClient } from '@/lib/supabase/server'
import { oneOf } from '@/lib/relations'
import { sportName } from '@/lib/sports'
import { genderName } from '@/lib/teams'
import { NewTeamForm } from './_components/new-team-form'
import { DeleteTeamButton } from './_components/delete-team-button'

export default async function PlantillesPage() {
  const { user, active } = await getSession()
  if (!active) return null

  const supabase = await createClient()

  if (active.role === 'familia') {
    const { data: kids } = await supabase
      .from('players')
      .select('id, full_name, dorsal, position, birth_year, teams(name)')
      .eq('club_id', active.clubId)
      .order('full_name')

    return (
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Plantilles</h1>
        <p className="mt-1 text-sm text-zinc-600">La fitxa dels teus fills.</p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {(kids ?? []).map((k) => (
            <Link
              key={k.id}
              href={`/dashboard/plantilles/jugador/${k.id}`}
              className="rounded-2xl border border-zinc-200 bg-white p-5 hover:border-emerald-300"
            >
              <div className="font-semibold text-zinc-900">{k.full_name}</div>
              <div className="mt-1 text-sm text-zinc-600">
                {k.position ?? 'Sense posició'} · {oneOf(k.teams)?.name ?? 'Sense equip'}
              </div>
            </Link>
          ))}
          {(!kids || kids.length === 0) && (
            <p className="text-sm text-zinc-600">Encara no hi ha cap jugador vinculat al teu compte.</p>
          )}
        </div>
      </div>
    )
  }

  const { data: teams } = await supabase
    .from('teams')
    .select('id, name, sport, gender, coach_name')
    .eq('club_id', active.clubId)
    .order('name')

  let visibleTeams = teams ?? []
  if (active.role === 'coordinador') {
    visibleTeams = visibleTeams.filter((t) => t.sport === active.section)
  } else if (active.role === 'entrenador') {
    const { data: staffRows } = await supabase.from('team_staff').select('team_id').eq('user_id', user.id)
    const myTeamIds = new Set((staffRows ?? []).map((r) => r.team_id))
    visibleTeams = visibleTeams.filter((t) => myTeamIds.has(t.id))
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Plantilles</h1>
          <p className="mt-1 text-sm text-zinc-600">
            {active.role === 'admin' && 'Totes les plantilles del club (lectura).'}
            {active.role === 'coordinador' && `Equips de la secció ${sportName(active.section ?? '')}.`}
            {active.role === 'entrenador' && 'El teu equip.'}
          </p>
        </div>
        {active.role === 'coordinador' && <NewTeamForm sectionLabel={sportName(active.section ?? '')} />}
      </div>

      {visibleTeams.length === 0 && (
        <p className="mt-6 text-sm text-zinc-600">
          Encara no hi ha cap equip {active.role === 'entrenador' ? 'assignat al teu compte' : 'en aquesta secció'}.
        </p>
      )}

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {visibleTeams.map((t) => (
          <div key={t.id} className="rounded-2xl border border-zinc-200 bg-white p-5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-semibold text-zinc-900">{t.name}</div>
                <div className="text-xs text-zinc-500">
                  {sportName(t.sport)}
                  {genderName(t.gender) ? ` ${genderName(t.gender)}` : ''} · {t.coach_name ?? 'Entrenador/a per assignar'}
                </div>
              </div>
              {active.role === 'coordinador' && <DeleteTeamButton teamId={t.id} teamName={t.name} />}
            </div>
            <Link
              href={`/dashboard/plantilles/${t.id}`}
              className="mt-4 inline-block text-xs font-semibold text-emerald-700 hover:underline"
            >
              Veure jugadors →
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}
