'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/membership'

function canManage(role: string) {
  return role === 'admin' || role === 'coordinador'
}

export async function createInstallation(formData: FormData) {
  const { active } = await getSession()
  if (!active || !canManage(active.role)) throw new Error('No autoritzat')

  const name = String(formData.get('name') ?? '').trim()
  if (!name) return
  const address = String(formData.get('address') ?? '').trim() || null

  const supabase = await createClient()
  const { error } = await supabase.from('installations').insert({ club_id: active.clubId, name, address })
  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/installations')
  revalidatePath('/dashboard/entrenaments')
  revalidatePath('/dashboard/partits')
}

export async function deleteInstallation(id: string) {
  const { active } = await getSession()
  if (!active || !canManage(active.role)) throw new Error('No autoritzat')

  const supabase = await createClient()
  const { error } = await supabase.from('installations').delete().eq('id', id)
  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/installations')
  revalidatePath('/dashboard/entrenaments')
  revalidatePath('/dashboard/partits')
}
