'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/membership'
import type { Role } from '@/lib/access'

function canManageScouting(role: Role) {
  return role === 'admin' || role === 'coordinador' || role === 'entrenador'
}

export async function createScoutedPlayer(formData: FormData) {
  const { user, active } = await getSession()
  if (!active || !canManageScouting(active.role)) throw new Error('No autoritzat')

  const sport = String(formData.get('sport') ?? '').trim()
  const fullName = String(formData.get('full_name') ?? '').trim()
  if (!sport || !fullName) return

  const birthYearRaw = String(formData.get('birth_year') ?? '').trim()
  const supabase = await createClient()
  const { error } = await supabase.from('scouted_players').insert({
    club_id: active.clubId,
    sport,
    full_name: fullName,
    birth_year: birthYearRaw ? Number(birthYearRaw) : null,
    position: String(formData.get('position') ?? '').trim() || null,
    current_club: String(formData.get('current_club') ?? '').trim() || null,
    notes: String(formData.get('notes') ?? '').trim() || null,
    created_by: user.id,
  })
  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/scouting')
}

export async function addObservation(scoutedPlayerId: string, formData: FormData) {
  const { user, active } = await getSession()
  if (!active || !canManageScouting(active.role)) throw new Error('No autoritzat')

  const supabase = await createClient()
  const { error } = await supabase.from('scouting_observations').insert({
    scouted_player_id: scoutedPlayerId,
    status: String(formData.get('status') ?? 'a_seguir'),
    notes: String(formData.get('notes') ?? '').trim() || null,
    observed_at: String(formData.get('observed_at') ?? '').trim() || null,
    created_by: user.id,
  })
  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/scouting')
}

export async function saveMatchPlan(matchId: string, content: string, scoutedPlayerIds: string[]) {
  const { user, active } = await getSession()
  if (!active || !canManageScouting(active.role)) throw new Error('No autoritzat')

  const supabase = await createClient()
  const { error } = await supabase.from('match_plans').upsert(
    {
      club_id: active.clubId,
      match_id: matchId,
      content: content.trim() || null,
      scouted_player_ids: scoutedPlayerIds,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'match_id' }
  )
  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/scouting')
}
