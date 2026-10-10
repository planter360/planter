'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/membership'
import { isUsableBrand } from '@/lib/color'

export async function saveClubBranding(logoUrl: string, primaryColor: string) {
  const { active } = await getSession()
  if (!active || active.role !== 'admin') throw new Error('No autoritzat')

  if (primaryColor && !isUsableBrand(primaryColor)) {
    throw new Error('Aquest color és massa clar: el text blanc dels botons no es llegiria.')
  }

  // Només s'accepta un logo pujat a la carpeta d'aquest club al nostre
  // Storage, mai una URL externa arbitrària.
  const allowedPrefix = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/club-logos/${active.clubId}/`
  if (logoUrl && !logoUrl.startsWith(allowedPrefix)) throw new Error('Logo no vàlid')

  const supabase = await createClient()
  const { error } = await supabase.rpc('update_club_branding', {
    p_club_id: active.clubId,
    p_logo_url: logoUrl,
    p_primary_color: primaryColor,
  })
  if (error) throw new Error(error.message)

  revalidatePath('/dashboard', 'layout')
}
