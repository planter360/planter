'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/membership'

export async function createAssessment(playerId: string, formData: FormData) {
  const { user, active } = await getSession()
  if (!active || (active.role !== 'coordinador' && active.role !== 'entrenador')) throw new Error('No autoritzat')

  const tec = Number(formData.get('tec'))
  const fis = Number(formData.get('fis'))
  const tac = Number(formData.get('tac'))
  const men = Number(formData.get('men'))
  if ([tec, fis, tac, men].some((v) => !Number.isInteger(v) || v < 1 || v > 5)) {
    throw new Error('Les valoracions han de ser un nombre enter entre 1 i 5')
  }

  const supabase = await createClient()
  const { error } = await supabase.from('assessments').insert({
    club_id: active.clubId,
    player_id: playerId,
    tec,
    fis,
    tac,
    men,
    notes: String(formData.get('notes') ?? '').trim() || null,
    author_id: user.id,
  })
  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/potencial')
}
