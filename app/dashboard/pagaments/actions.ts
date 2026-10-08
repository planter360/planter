'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/membership'
import { eurosToCents, formatEuros } from '@/lib/money'
import { appOrigin, escapeHtml, sendEmail } from '@/lib/email'

export async function createReceipt(formData: FormData): Promise<{ notice?: string; warning?: boolean }> {
  const { active } = await getSession()
  if (!active || active.role !== 'admin') throw new Error('No autoritzat')

  const playerId = String(formData.get('player_id') ?? '')
  const concept = String(formData.get('concept') ?? '').trim()
  const amount = String(formData.get('amount') ?? '')
  const dueDate = String(formData.get('due_date') ?? '')
  if (!playerId || !concept || !dueDate) return {}

  const amountCents = eurosToCents(amount)
  const supabase = await createClient()
  const { error } = await supabase.from('receipts').insert({
    club_id: active.clubId,
    player_id: playerId,
    concept,
    amount_cents: amountCents,
    due_date: dueDate,
  })
  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/pagaments')

  // Avís a la família: només als familiars que ja tenen compte vinculat
  // (les invitacions pendents encara no poden veure el rebut).
  const { data: guardians } = await supabase.rpc('player_guardians', { p_player_id: playerId })
  const emails = ((guardians ?? []) as { email: string; pending: boolean }[]).filter((g) => !g.pending).map((g) => g.email)
  if (emails.length === 0) {
    return { warning: true, notice: 'Rebut emès. Aquest jugador no té cap familiar vinculat: ningú n’ha rebut l’avís.' }
  }

  const { data: player } = await supabase.from('players').select('full_name').eq('id', playerId).maybeSingle()
  const origin = await appOrigin()
  const due = new Date(`${dueDate}T12:00:00Z`).toLocaleDateString('ca-ES')
  const results = await Promise.all(
    emails.map((to) =>
      sendEmail({
        to,
        subject: `Nou rebut de ${active.clubName}: ${concept}`,
        html: `<p>Hola,</p>
<p>${escapeHtml(active.clubName)} ha emès un rebut per a <strong>${escapeHtml(player?.full_name ?? '')}</strong>:</p>
<p><strong>${escapeHtml(concept)}</strong> · ${escapeHtml(formatEuros(amountCents))} · venciment ${due}</p>
<p>El pots consultar a <a href="${origin}/dashboard/pagaments">${origin}/dashboard/pagaments</a>.</p>`,
      })
    )
  )
  const sent = results.filter(Boolean).length
  if (sent === emails.length) return { notice: `Rebut emès i avís enviat a ${emails.join(', ')}.` }
  return {
    warning: true,
    notice: `Rebut emès, però no s'ha pogut enviar l'avís per correu${sent ? ` a tots els familiars (${sent} de ${emails.length})` : ''}.`,
  }
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
