'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/membership'

export async function saveTrainingSchedule(teamId: string, formData: FormData) {
  const { active } = await getSession()
  if (!active || active.role !== 'entrenador') throw new Error('No autoritzat')

  const days = formData.getAll('days').map(String)
  const timeText = String(formData.get('time_txt') ?? '').trim()
  const place = String(formData.get('place') ?? '').trim()
  const rainPlace = String(formData.get('rain_place') ?? '').trim()
  if (!timeText || !place) return

  const supabase = await createClient()
  const { data: existing } = await supabase.from('trainings').select('id').eq('team_id', teamId).maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from('trainings')
      .update({ days, time_txt: timeText, place, rain_place: rainPlace || null })
      .eq('id', existing.id)
    if (error) throw new Error(error.message)
  } else {
    const { error } = await supabase
      .from('trainings')
      .insert({ club_id: active.clubId, team_id: teamId, days, time_txt: timeText, place, rain_place: rainPlace || null })
    if (error) throw new Error(error.message)
  }

  revalidatePath('/dashboard/entrenaments')
}

export async function setRainPlan(teamId: string, rainActive: boolean) {
  const { active } = await getSession()
  if (!active || active.role !== 'entrenador') throw new Error('No autoritzat')

  const supabase = await createClient()
  const { error } = await supabase.from('trainings').update({ rain_active: rainActive }).eq('team_id', teamId)
  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/entrenaments')
}

export async function createSession(
  teamId: string,
  input: { startsAtISO: string; place: string; focus: string }
) {
  const { active } = await getSession()
  if (!active || active.role !== 'entrenador') throw new Error('No autoritzat')
  if (!input.startsAtISO) return

  const supabase = await createClient()
  const { data: session, error } = await supabase
    .from('sessions')
    .insert({
      club_id: active.clubId,
      team_id: teamId,
      starts_at: input.startsAtISO,
      place: input.place || null,
      focus: input.focus || null,
    })
    .select('id')
    .single()
  if (error) throw new Error(error.message)

  // Seed one attendance row per current squad member so the coach's list
  // starts fully "present", and so families can later toggle their child's
  // row with an UPDATE — guardians aren't allowed to INSERT attendance rows.
  const { data: squad } = await supabase.from('players').select('id').eq('team_id', teamId)
  if (squad && squad.length > 0) {
    const { error: attendanceError } = await supabase
      .from('attendance')
      .insert(squad.map((p) => ({ session_id: session.id, player_id: p.id, present: true, family_notified: false })))
    if (attendanceError) throw new Error(attendanceError.message)
  }

  revalidatePath('/dashboard/entrenaments')
}

export async function deleteSession(sessionId: string) {
  const { active } = await getSession()
  if (!active || active.role !== 'entrenador') throw new Error('No autoritzat')

  const supabase = await createClient()
  const { error } = await supabase.from('sessions').delete().eq('id', sessionId)
  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/entrenaments')
}

export async function toggleAttendance(sessionId: string, playerId: string, currentlyPresent: boolean) {
  const { active } = await getSession()
  if (!active || active.role !== 'entrenador') throw new Error('No autoritzat')

  const supabase = await createClient()
  const { data: existing } = await supabase
    .from('attendance')
    .select('player_id')
    .eq('session_id', sessionId)
    .eq('player_id', playerId)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from('attendance')
      .update({ present: !currentlyPresent })
      .eq('session_id', sessionId)
      .eq('player_id', playerId)
    if (error) throw new Error(error.message)
  } else {
    const { error } = await supabase
      .from('attendance')
      .insert({ session_id: sessionId, player_id: playerId, present: !currentlyPresent })
    if (error) throw new Error(error.message)
  }

  revalidatePath('/dashboard/entrenaments')
}

export async function toggleFamilyNotified(sessionId: string, playerId: string, currentlyNotified: boolean) {
  const { active } = await getSession()
  if (!active || active.role !== 'familia') throw new Error('No autoritzat')

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('attendance')
    .update({ family_notified: !currentlyNotified })
    .eq('session_id', sessionId)
    .eq('player_id', playerId)
    .select('player_id')

  if (error) throw new Error(error.message)
  if (!data || data.length === 0) {
    // Guardians can't insert attendance rows (only the coach can, per RLS),
    // so this only happens if the child joined the team after the session
    // was created and the coach hasn't taken any list since.
    throw new Error("Encara no hi ha assistència registrada per aquesta sessió. Demana a l'entrenador que passi llista.")
  }

  revalidatePath('/dashboard/entrenaments')
}
