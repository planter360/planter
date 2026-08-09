'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/membership'

export async function createMatch(teamId: string, input: { rival: string; startsAtISO: string; place: string }) {
  const { active } = await getSession()
  if (!active || (active.role !== 'coordinador' && active.role !== 'entrenador')) throw new Error('No autoritzat')
  if (!input.rival.trim()) return

  const supabase = await createClient()
  const { error } = await supabase.from('matches').insert({
    club_id: active.clubId,
    team_id: teamId,
    rival: input.rival.trim(),
    starts_at: input.startsAtISO || null,
    place: input.place || null,
  })
  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/partits')
}

export async function deleteMatch(matchId: string) {
  const { active } = await getSession()
  if (!active || (active.role !== 'coordinador' && active.role !== 'entrenador')) throw new Error('No autoritzat')

  const supabase = await createClient()
  const { error } = await supabase.from('matches').delete().eq('id', matchId)
  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/partits')
}

export async function setMatchResult(matchId: string, formData: FormData) {
  const { active } = await getSession()
  if (!active || (active.role !== 'coordinador' && active.role !== 'entrenador')) throw new Error('No autoritzat')

  const status = String(formData.get('status') ?? 'jugat')
  const result = String(formData.get('result') ?? '').trim()

  const supabase = await createClient()
  const { error } = await supabase.from('matches').update({ status, result: result || null }).eq('id', matchId)
  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/partits')
}

export async function saveCallups(matchId: string, selectedPlayerIds: string[]) {
  const { active } = await getSession()
  if (!active || active.role !== 'entrenador') throw new Error('No autoritzat')

  const supabase = await createClient()

  const { data: existing } = await supabase.from('callups').select('player_id').eq('match_id', matchId)
  const existingIds = new Set((existing ?? []).map((r) => r.player_id))
  const selectedSet = new Set(selectedPlayerIds)

  const toAdd = selectedPlayerIds.filter((id) => !existingIds.has(id))
  const toRemove = [...existingIds].filter((id) => !selectedSet.has(id))

  if (toAdd.length) {
    const { error } = await supabase.from('callups').insert(toAdd.map((player_id) => ({ match_id: matchId, player_id })))
    if (error) throw new Error(error.message)
  }
  if (toRemove.length) {
    const { error } = await supabase.from('callups').delete().eq('match_id', matchId).in('player_id', toRemove)
    if (error) throw new Error(error.message)
  }

  const { error: statusError } = await supabase.from('matches').update({ status: 'convocat' }).eq('id', matchId)
  if (statusError) throw new Error(statusError.message)

  revalidatePath('/dashboard/partits')
}

export async function setConfirmed(matchId: string, playerId: string, confirmed: boolean) {
  const { active } = await getSession()
  if (!active || active.role !== 'familia') throw new Error('No autoritzat')

  const supabase = await createClient()
  const { error } = await supabase.from('callups').update({ confirmed }).eq('match_id', matchId).eq('player_id', playerId)
  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/partits')
}
