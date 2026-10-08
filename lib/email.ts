import { headers } from 'next/headers'
import nodemailer, { type Transporter } from 'nodemailer'

export function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
}

let transporter: Transporter | null = null

// SMTP genèric: Gmail durant la beta (smtp.gmail.com + contrasenya
// d'aplicació) i Resend quan hi hagi domini (smtp.resend.com, usuari
// "resend", contrasenya = API key), sense canviar codi.
function getTransporter(): Transporter | null {
  const host = process.env.SMTP_HOST
  if (!host || !process.env.SMTP_USER || !process.env.SMTP_PASS) return null
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT ?? 465)
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    })
  }
  return transporter
}

// Retorna false (sense llançar) si el correu no està configurat o falla,
// perquè qui crida pugui avisar sense perdre l'acció principal.
export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }): Promise<boolean> {
  const t = getTransporter()
  if (!t) return false

  try {
    await t.sendMail({
      from: process.env.EMAIL_FROM ?? `Planter <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    })
    return true
  } catch (e) {
    console.error('sendEmail', e)
    return false
  }
}

export async function appOrigin(): Promise<string> {
  const h = await headers()
  return h.get('origin') ?? `https://${h.get('host')}`
}
