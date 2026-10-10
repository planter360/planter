import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { isUsableBrand } from '@/lib/color'

export interface ClubBranding {
  logoUrl: string | null
  primaryColor: string | null
  plan: string
}

// Consulta separada de getSession: si les columnes encara no existeixen
// (migració 017 pendent) es fan servir els valors per defecte en
// comptes de deixar l'usuari sense accés al tauler.
export const getClubBranding = cache(async (clubId: string): Promise<ClubBranding> => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('clubs')
    .select('logo_url, primary_color, plan')
    .eq('id', clubId)
    .maybeSingle()

  if (error || !data) return { logoUrl: null, primaryColor: null, plan: 'pilot' }
  return {
    logoUrl: data.logo_url,
    primaryColor: data.primary_color && isUsableBrand(data.primary_color) ? data.primary_color : null,
    plan: data.plan ?? 'pilot',
  }
})
