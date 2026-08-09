'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/membership'
import { eurosToCents } from '@/lib/money'

export async function createReceipt(formData: FormData) {
  const { active } = await getSession()
  if (!active || active.role !== 'admin') throw new Error('No autoritzat')

  const playerId = String(formData.get('player_id') ?? '')
  const concept = String(formData.get('concept') ?? '').trim()
  const amount = String(formData.get('amount') ?? '')
  const dueDate = String(formData.get('due_date') ?? '')
  if (!playerId || !concept || !dueDate) return

  const supabase = await createClient()
  const { error } = await supabase.from('receipts').insert({
    club_id: active.clubId,
    player_id: playerId,
    concept,
    amount_cents: eurosToCents(amount),
    due_date: dueDate,
  })
  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/pagaments')
}

export async function markReceiptStatus(receiptId: string, status: 'pagat' | 'vencut' | 'pendent') {
  const { active } = await getSession()
  if (!active || active.role !== 'admin') throw new Error('No autoritzat')

  const supabase = await createClient()
  const { error } = await supabase
    .from('receipts')
    .update({ status, paid_at: status === 'pagat' ? new Date().toISOString() : null })
    .eq('id', receiptId)
  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/pagaments')
}
