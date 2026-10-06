'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/membership'
import { TEAM_GENDERS, type BulkPlayerRow } from '@/lib/teams'

export async function createTeam(formData: FormData) {
  const { active } = await getSession()
  if (!active || active.role !== 'coordinador' || !active.section) {
    throw new Error('Només un coordinador de secció pot crear equips.')
  }

  const name = String(formData.get('name') ?? '').trim()
  if (!name) return
  const coachName = String(formData.get('coach_name') ?? '').trim()
  const gender = String(formData.get('gender') ?? '')

  const supabase = await createClient()
  const { error } = await supabase.from('teams').insert({
    club_id: active.clubId,
    sport: active.section,
    name,
    gender: TEAM_GENDERS.some((g) => g.id === gender) ? gender : null,
    coach_name: coachName || null,
  })
  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/plantilles')
}

export async function deleteTeam(teamId: string) {
  const { active } = await getSession()
  if (!active) throw new Error('No autoritzat')

  const supabase = await createClient()
  const { error } = await supabase.from('teams').delete().eq('id', teamId)
  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/plantilles')
}

export async function createPlayer(teamId: string, formData: FormData) {
  const { active } = await getSession()
  if (!active || active.role === 'familia') throw new Error('No autoritzat')

  const fullName = String(formData.get('full_name') ?? '').trim()
  if (!fullName) return
  const dorsalRaw = String(formData.get('dorsal') ?? '').trim()
  const position = String(formData.get('position') ?? '').trim()
  const birthRaw = String(formData.get('birth_year') ?? '').trim()

  const supabase = await createClient()
  const { error } = await supabase.from('players').insert({
    club_id: active.clubId,
    team_id: teamId,
    full_name: fullName,
    dorsal: dorsalRaw ? Number(dorsalRaw) : null,
    position: position || null,
    birth_year: birthRaw ? Number(birthRaw) : null,
  })
  if (error) throw new Error(error.message)

  revalidatePath(`/dashboard/plantilles/${teamId}`)
}

export async function createPlayersBulk(teamId: string, rows: BulkPlayerRow[]) {
  const { active } = await getSession()
  if (!active || active.role === 'familia') throw new Error('No autoritzat')
  if (rows.length > 100) throw new Error('Màxim 100 jugadors per cop')

  const toInt = (v: unknown) => (Number.isInteger(v) ? (v as number) : null)
  const clean = rows
    .map((r) => ({
      club_id: active.clubId,
      team_id: teamId,
      full_name: String(r.full_name ?? '').trim(),
      dorsal: toInt(r.dorsal),
      position: String(r.position ?? '').trim() || null,
      birth_year: toInt(r.birth_year),
    }))
    .filter((r) => r.full_name)
  if (clean.length === 0) return

  const supabase = await createClient()
  const { error } = await supabase.from('players').insert(clean)
  if (error) throw new Error(error.message)

  revalidatePath(`/dashboard/plantilles/${teamId}`)
}

export async function deletePlayer(teamId: string, playerId: string) {
  const { active } = await getSession()
  if (!active) throw new Error('No autoritzat')

  const supabase = await createClient()
  const { error } = await supabase.from('players').delete().eq('id', playerId)
  if (error) throw new Error(error.message)

  revalidatePath(`/dashboard/plantilles/${teamId}`)
}

// L'historial d'equips el registra un trigger a la base de dades
// (migració 013) cada cop que canvia players.team_id.
export async function changePlayerTeam(playerId: string, newTeamId: string) {
  const { active } = await getSession()
  if (!active || (active.role !== 'coordinador' && active.role !== 'admin')) throw new Error('No autoritzat')
  if (!newTeamId) return

  const supabase = await createClient()
  const { data: target } = await supabase
    .from('teams')
    .select('id, sport')
    .eq('id', newTeamId)
    .eq('club_id', active.clubId)
    .maybeSingle()
  if (!target) throw new Error('Equip no vàlid')
  if (active.role === 'coordinador' && target.sport !== active.section) {
    throw new Error('Només pots moure jugadors a equips de la teva secció')
  }

  const { error } = await supabase.from('players').update({ team_id: newTeamId }).eq('id', playerId)
  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/plantilles', 'layout')
}

export async function addSecondaryTeam(playerId: string, teamId: string) {
  const { active } = await getSession()
  if (!active || (active.role !== 'coordinador' && active.role !== 'admin')) throw new Error('No autoritzat')
  if (!teamId) return

  const supabase = await createClient()
  const { error } = await supabase
    .from('player_teams')
    .insert({ club_id: active.clubId, player_id: playerId, team_id: teamId })
  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/plantilles')
}

export async function removeSecondaryTeam(playerId: string, teamId: string) {
  const { active } = await getSession()
  if (!active || (active.role !== 'coordinador' && active.role !== 'admin')) throw new Error('No autoritzat')

  const supabase = await createClient()
  const { error } = await supabase.from('player_teams').delete().eq('player_id', playerId).eq('team_id', teamId)
  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/plantilles')
}
