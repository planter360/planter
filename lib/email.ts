export function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
}

// Envia via l'API REST de Resend. Retorna false (sense llançar) si no
// hi ha clau configurada o Resend rebutja l'enviament, perquè qui crida
// pugui avisar l'usuari sense perdre l'acció principal (crear l'equip).
export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }): Promise<boolean> {
  const key = process.env.RESEND_API_KEY
  if (!key) return false

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM ?? 'Planter <onboarding@resend.dev>',
        to,
        subject,
        html,
      }),
    })
    return res.ok
  } catch {
    return false
  }
}
