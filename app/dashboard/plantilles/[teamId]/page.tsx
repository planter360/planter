import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getSession } from '@/lib/membership'
import { createClient } from '@/lib/supabase/server'
import { oneOf } from '@/lib/relations'
import { sportName } from '@/lib/sports'
import { genderName } from '@/lib/teams'
import { NewPlayerForm } from './_components/new-player-form'
import { BulkPlayersForm } from './_components/bulk-players-form'
import { AssignCoachForm } from './_components/assign-coach-form'
import { TeamGenderSelect } from './_components/team-gender-select'
import type { CoachOption } from '../_components/coach-picker'
import { DeletePlayerButton } from './_components/delete-player-button'
import { LinkSecondaryTeam } from './_components/link-secondary-team'
import { RemoveSecondaryLink } from './_components/remove-secondary-link'

type HomeTeamJoin = { name: string }
type SecondaryPlayerJoin = {
  id: string
  full_name: string
  dorsal: number | null
  position: string | null
  birth_year: number | null
  teams: HomeTeamJoin | HomeTeamJoin[] | null
}

export default async function TeamPlayersPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await params
  const { active } = await getSession()
  if (!active) return null

  const supabase = await createClient()

  const { data: team } = await supabase
    .from('teams')
    .select('id, name, sport, gender, coach_name')
    .eq('id', teamId)
    .eq('club_id', active.clubId)
    .maybeSingle()

  if (!team) notFound()

  const { data: players } = await supabase
    .from('players')
    .select('id, full_name, dorsal, position, birth_year')
    .eq('team_id', teamId)
    .order('dorsal', { ascending: true, nullsFirst: false })

  const { data: secondaryLinks } = await supabase
    .from('player_teams')
    .select('players(id, full_name, dorsal, position, birth_year, teams(name))')
    .eq('team_id', teamId)

  const secondaryPlayers = (secondaryLinks ?? [])
    .map((link) => oneOf(link.players as SecondaryPlayerJoin | SecondaryPlayerJoin[] | null))
    .filter((p): p is SecondaryPlayerJoin => Boolean(p))

  // players_write (alta) permet coordinador de la secció i entrenador de l'equip.
  const canManage = active.role === 'coordinador' || active.role === 'entrenador'
  // players_delete (baixa) només admin i coordinador — l'entrenador no hi té accés per RLS.
  const canDelete = active.role === 'coordinador' || active.role === 'admin'
  const canLinkTeams = active.role === 'coordinador'

  let otherTeamOptions: { id: string; name: string }[] = []
  if (canLinkTeams) {
    const { data: otherTeams } = await supabase
      .from('teams')
      .select('id, name')
      .eq('club_id', active.clubId)
      .eq('sport', active.section ?? '')
      .neq('id', teamId)
    otherTeamOptions = otherTeams ?? []
  }

  const canAssignCoach = active.role === 'coordinador' || active.role === 'admin'
  let coaches: CoachOption[] = []
  if (canAssignCoach) {
    const { data } = await supabase.rpc('club_coaches', { p_club_id: active.clubId })
    coaches = (data ?? []) as CoachOption[]
  }

  return (
    <div>
      <Link href="/dashboard/plantilles" className="text-xs font-semibold text-zinc-500 hover:underline">
        ← Tots els equips
      </Link>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">{team.name}</h1>
          <p className="mt-1 text-sm text-zinc-600">
            {sportName(team.sport)}
            {genderName(team.gender) ? ` ${genderName(team.gender)}` : ''} · {team.coach_name ?? 'Entrenador/a per assignar'}
          </p>
          {canAssignCoach && (
            <div className="mt-1 flex flex-wrap items-center gap-3">
              <TeamGenderSelect teamId={team.id} gender={team.gender} />
              <AssignCoachForm teamId={team.id} coaches={coaches} />
            </div>
          )}
        </div>
        {canManage && (
          <div className="flex flex-wrap gap-2">
            <BulkPlayersForm teamId={team.id} />
            <NewPlayerForm teamId={team.id} />
          </div>
        )}
      </div>

      {(!players || players.length === 0) && (
        <p className="mt-6 text-sm text-zinc-600">
          Encara no hi ha jugadors en aquest equip.
          {canManage ? ' Fes servir «+ Nou jugador/a» per començar la plantilla.' : ''}
        </p>
      )}

      <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {(players ?? []).map((p) => (
          <div key={p.id} className="flex flex-col gap-2 rounded-2xl border border-zinc-200 bg-white p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-sm font-bold text-white">
                {p.dorsal ?? '–'}
              </div>
              <div className="flex-1">
                <Link href={`/dashboard/plantilles/jugador/${p.id}`} className="font-semibold text-zinc-900 hover:underline">
                  {p.full_name}
                </Link>
                <div className="text-xs text-zinc-500">
                  {p.position ?? 'Sense posició'}
                  {p.birth_year ? ` · ${p.birth_year}` : ''}
                </div>
              </div>
              {canDelete && <DeletePlayerButton teamId={team.id} playerId={p.id} playerName={p.full_name} />}
            </div>
            {canLinkTeams && <LinkSecondaryTeam playerId={p.id} teamOptions={otherTeamOptions} />}
          </div>
        ))}
      </div>

      {secondaryPlayers.length > 0 && (
        <>
          <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Jugadors d&apos;un altre equip que també hi entrenen
          </h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {secondaryPlayers.map((p) => (
              <div key={p.id} className="flex items-center gap-3 rounded-2xl border border-dashed border-zinc-300 bg-white p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-400 text-sm font-bold text-white">
                  {p.dorsal ?? '–'}
                </div>
                <div className="flex-1">
                  <Link href={`/dashboard/plantilles/jugador/${p.id}`} className="font-semibold text-zinc-900 hover:underline">
                    {p.full_name}
                  </Link>
                  <div className="text-xs text-zinc-500">Equip principal: {oneOf(p.teams)?.name ?? '—'}</div>
                </div>
                {canLinkTeams && <RemoveSecondaryLink playerId={p.id} teamId={team.id} playerName={p.full_name} />}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
