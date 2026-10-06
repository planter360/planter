'use server'

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/membership'
import { escapeHtml, sendEmail } from '@/lib/email'
import { TEAM_GENDERS, type BulkPlayerRow } from '@/lib/teams'

// Els permisos reals els comproven les funcions SQL (assign_team_coach,
// invite_team_coach): admin del club o coordinador de la secció.
interface CoachResult {
  notice?: string
  warning?: boolean
}

async function applyCoachChoice(
  team: { id: string; name: string },
  clubName: string,
  formData: FormData
): Promise<CoachResult> {
  const mode = String(formData.get('coach_mode') ?? 'none')
  const supabase = await createClient()

  if (mode === 'existing') {
    const userId = String(formData.get('coach_user_id') ?? '')
    if (!userId) return {}
    const { error } = await supabase.rpc('assign_team_coach', { p_team_id: team.id, p_user_id: userId })
    if (error) throw new Error(error.message)
    return { notice: 'Entrenador/a vinculat/da a l’equip.' }
  }

  if (mode !== 'new') return {}

  const email = String(formData.get('coach_email') ?? '').trim()
  const fullName = String(formData.get('coach_full_name') ?? '').trim()
  if (!email) return {}

  const { data: status, error } = await supabase.rpc('invite_team_coach', {
    p_team_id: team.id,
    p_email: email,
    p_full_name: fullName,
  })
  if (error) throw new Error(error.message)

  const h = await headers()
  const origin = h.get('origin') ?? `https://${h.get('host')}`
  const greeting = fullName ? `Hola ${escapeHtml(fullName)},` : 'Hola,'
  const sent = await sendEmail({
    to: email,
    subject: `T'han afegit com a entrenador/a de ${team.name} a Planter`,
    html: `<p>${greeting}</p>
<p>${escapeHtml(clubName)} t'ha afegit com a entrenador/a de l'equip <strong>${escapeHtml(team.name)}</strong> a Planter.</p>
<p>Per entrar, ves a <a href="${origin}/login">${origin}/login</a> i posa aquest mateix correu (${escapeHtml(email)}). Rebràs un enllaç d'accés, sense contrasenyes.</p>`,
  })

  if (status === 'linked') {
    return sent
      ? { notice: `${email} ja tenia compte: vinculat/da a l'equip i avisat/da per correu.` }
      : { notice: `${email} ja tenia compte i ha quedat vinculat/da a l'equip.` }
  }
  if (sent) return { notice: `Invitació enviada a ${email}.` }
  return {
    warning: true,
    notice: `Invitació creada per a ${email}. El correu automàtic encara no està configurat: digues-li que entri a ${origin}/login amb aquest correu i quedarà vinculat/da a l'equip.`,
  }
}

export async function createTeam(formData: FormData): Promise<CoachResult> {
  const { active } = await getSession()
  if (!active || active.role !== 'coordinador' || !active.section) {
    throw new Error('Només un coordinador de secció pot crear equips.')
  }

  const name = String(formData.get('name') ?? '').trim()
  if (!name) return {}
  const gender = String(formData.get('gender') ?? '')

  const supabase = await createClient()
  const { data: team, error } = await supabase
    .from('teams')
    .insert({
      club_id: active.clubId,
      sport: active.section,
      name,
      gender: TEAM_GENDERS.some((g) => g.id === gender) ? gender : null,
    })
    .select('id, name')
    .single()
  if (error) throw new Error(error.message)

  let result: CoachResult
  try {
    result = await applyCoachChoice(team, active.clubName, formData)
  } catch (e) {
    result = {
      warning: true,
      notice: `Equip creat, però no s'ha pogut vincular l'entrenador/a: ${e instanceof Error ? e.message : 'error desconegut'}`,
    }
  }

  revalidatePath('/dashboard/plantilles', 'layout')
  return result
}

export async function assignCoach(teamId: string, formData: FormData): Promise<CoachResult> {
  const { active } = await getSession()
  if (!active || (active.role !== 'coordinador' && active.role !== 'admin')) throw new Error('No autoritzat')

  const supabase = await createClient()
  const { data: team } = await supabase.from('teams').select('id, name').eq('id', teamId).maybeSingle()
  if (!team) throw new Error('Equip no trobat')

  const result = await applyCoachChoice(team, active.clubName, formData)

  revalidatePath('/dashboard/plantilles', 'layout')
  return result
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
