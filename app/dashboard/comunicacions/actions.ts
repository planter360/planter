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
  const validSportIds = new Set<string>(SPORTS.map((s) => s.id))

  // El scope decideix qui ho rep — sempre es deriva del rol/secció/equips
  // reals del remitent al servidor, mai es pren tal qual del formulari,
  // perquè una petició manipulada no pugui emetre més enllà del que el
  // rol té permès.
  let scope: string
  if (active.role === 'admin') {
    const target = String(formData.get('target') ?? 'club')
    if (target === 'families') {
      scope = 'families'
    } else if (target === 'section') {
      const sectionValue = String(formData.get('target_section') ?? '')
      if (!validSportIds.has(sectionValue)) throw new Error('Secció no vàlida')
      scope = `section:${sectionValue}`
    } else if (target === 'teams') {
      const teamIds = formData.getAll('team_ids').map(String).filter(Boolean)
      if (teamIds.length === 0) throw new Error('Selecciona almenys un equip')
      const { data: validTeams } = await supabase.from('teams').select('id').eq('club_id', active.clubId).in('id', teamIds)
      if (!validTeams || validTeams.length !== teamIds.length) throw new Error('Equip no vàlid')
      scope = `teams:${teamIds.join(',')}`
    } else {
      scope = 'club'
    }
  } else if (active.role === 'coordinador') {
    if (!active.section) throw new Error('Falta la secció del coordinador')
    const target = String(formData.get('target') ?? 'section')
    if (target === 'teams') {
      const teamIds = formData.getAll('team_ids').map(String).filter(Boolean)
      if (teamIds.length === 0) throw new Error('Selecciona almenys un equip')
      const { data: validTeams } = await supabase
        .from('teams')
        .select('id')
        .eq('club_id', active.clubId)
        .eq('sport', active.section)
        .in('id', teamIds)
      if (!validTeams || validTeams.length !== teamIds.length) throw new Error('Equip no vàlid per a la teva secció')
      scope = `teams:${teamIds.join(',')}`
    } else {
      scope = `section:${active.section}`
    }
  } else {
    const teamIds = formData.getAll('team_ids').map(String).filter(Boolean)
    if (teamIds.length === 0) throw new Error('Selecciona almenys un equip')
    const { data: staffRows } = await supabase.from('team_staff').select('team_id').eq('user_id', user.id).in('team_id', teamIds)
    if (!staffRows || staffRows.length !== teamIds.length) throw new Error('No gestiones algun d\'aquests equips')
    scope = `teams:${teamIds.join(',')}`
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
