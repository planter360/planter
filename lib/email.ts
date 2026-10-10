import { headers } from 'next/headers'
import nodemailer, { type Transporter } from 'nodemailer'
import { brandStrong, DEFAULT_BRAND, isUsableBrand } from '@/lib/color'
import { getClubBranding } from '@/lib/club'

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

export interface EmailBrand {
  clubName: string
  logoUrl: string | null
  color: string | null
}

// Plantilla comuna de tots els correus de l'app. Taules i estils inline
// perquè és l'únic que Gmail i Outlook respecten. Els textos que venen
// d'usuaris s'han d'escapar abans de passar-los com a bodyHtml.
export function emailLayout({
  origin,
  brand,
  heading,
  bodyHtml,
  cta,
}: {
  origin: string
  brand: EmailBrand
  heading: string
  bodyHtml: string
  cta?: { label: string; url: string }
}): string {
  const accent = brandStrong(brand.color && isUsableBrand(brand.color) ? brand.color : DEFAULT_BRAND)
  const logo = brand.logoUrl ?? `${origin}/icon-192.png`
  const club = escapeHtml(brand.clubName)

  const button = cta
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 8px">
  <tr><td style="border-radius:10px;background:${accent}">
    <a href="${cta.url}" style="display:inline-block;padding:12px 22px;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none">${escapeHtml(cta.label)}</a>
  </td></tr>
</table>
<p style="margin:0;font-size:12px;color:#5D6B61">Si el botó no funciona, copia aquest enllaç: <a href="${cta.url}" style="color:${accent}">${cta.url}</a></p>`
    : ''

  return `<!doctype html>
<html lang="ca"><body style="margin:0;padding:0;background:#F3F5F0;font-family:Arial,Helvetica,sans-serif;color:#16211A">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F3F5F0;padding:24px 12px">
<tr><td align="center">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #E2E7DF;border-radius:16px;overflow:hidden">
    <tr><td style="background:#0F1E17;padding:18px 28px">
      <table role="presentation" cellpadding="0" cellspacing="0"><tr>
        <td style="padding-right:12px"><img src="${logo}" width="40" height="40" alt="" style="display:block;border-radius:8px;background:#ffffff"></td>
        <td style="font-size:16px;font-weight:bold;color:#ffffff">${club}</td>
      </tr></table>
    </td></tr>
    <tr><td style="height:4px;line-height:4px;font-size:0;background:${accent}">&nbsp;</td></tr>
    <tr><td style="padding:28px;font-size:15px;line-height:1.55">
      <h1 style="margin:0 0 14px;font-size:20px;line-height:1.3;color:#16211A">${escapeHtml(heading)}</h1>
      ${bodyHtml}
      ${button}
    </td></tr>
    <tr><td style="padding:16px 28px;border-top:1px solid #E2E7DF;font-size:12px;line-height:1.5;color:#5D6B61">
      Enviat per <strong>Planter</strong> en nom de ${club}. Has rebut aquest correu perquè el club t'ha donat accés a la seva plataforma.
    </td></tr>
  </table>
</td></tr>
</table>
</body></html>`
}

export async function emailBrand(clubId: string, clubName: string): Promise<EmailBrand> {
  const { logoUrl, primaryColor } = await getClubBranding(clubId)
  return { clubName, logoUrl, color: primaryColor }
}

export async function appOrigin(): Promise<string> {
  const h = await headers()
  return h.get('origin') ?? `https://${h.get('host')}`
}
