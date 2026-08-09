'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/membership'
import { SPORTS } from '@/lib/sports'

export async function sendAnnouncement(formData: FormData) {
  const { user, active } = await getSession()
  if (!active || active.role === 'familia') throw new Error('No autoritzat')

  const title = String(formData.get('title') ?? '').trim()
  const body = String(formData.get('body') ?? '').trim()
  if (!title) return

  const supabase = await createClient()

  // The scope decides who receives this — it's always derived from the
  // sender's actual role/section/team on the server, never taken as-is
  // from the form, so a forged request can't broadcast beyond what the
  // role is allowed to reach.
  let scope: string
  if (active.role === 'admin') {
    const target = String(formData.get('target') ?? 'club')
    const validSectionTargets = SPORTS.map((s) => `section:${s.id}`)
    scope = target === 'families' || validSectionTargets.includes(target) ? target : 'club'
  } else if (active.role === 'coordinador') {
    if (!active.section) throw new Error('Falta la secció del coordinador')
    scope = `section:${active.section}`
  } else {
    const teamId = String(formData.get('team_id') ?? '')
    const { data: staffRow } = await supabase
      .from('team_staff')
      .select('team_id')
      .eq('user_id', user.id)
      .eq('team_id', teamId)
      .maybeSingle()
    if (!staffRow) throw new Error('No gestiones aquest equip')
    scope = `team:${teamId}`
  }

  const { error } = await supabase.from('announcements').insert({
    club_id: active.clubId,
    scope,
    title,
    body: body || null,
    author_id: user.id,
  })
  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/comunicacions')
}
