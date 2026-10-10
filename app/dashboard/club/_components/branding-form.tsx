'use client'

import { useState, type CSSProperties } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DEFAULT_BRAND, isHexColor, isUsableBrand } from '@/lib/color'
import { saveClubBranding } from '../actions'

const MAX_BYTES = 1024 * 1024
const ALLOWED_TYPES: Record<string, string> = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' }

export function BrandingForm({
  clubId,
  clubName,
  initialLogoUrl,
  initialColor,
}: {
  clubId: string
  clubName: string
  initialLogoUrl: string | null
  initialColor: string | null
}) {
  const [logoUrl, setLogoUrl] = useState(initialLogoUrl ?? '')
  const [color, setColor] = useState(initialColor ?? DEFAULT_BRAND)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const validColor = isHexColor(color)
  const usable = validColor && isUsableBrand(color)

  const upload = async (file: File) => {
    setError('')
    setMessage('')
    const ext = ALLOWED_TYPES[file.type]
    if (!ext) return setError('El logo ha de ser PNG, JPG o WebP.')
    if (file.size > MAX_BYTES) return setError('El logo no pot passar d’1 MB.')

    setUploading(true)
    const supabase = createClient()
    const path = `${clubId}/logo-${Date.now()}.${ext}`
    const { error: uploadError } = await supabase.storage.from('club-logos').upload(path, file, { contentType: file.type })
    setUploading(false)
    if (uploadError) return setError(`No s’ha pogut pujar: ${uploadError.message}`)
    setLogoUrl(supabase.storage.from('club-logos').getPublicUrl(path).data.publicUrl)
  }

  const save = async () => {
    setSaving(true)
    setError('')
    setMessage('')
    try {
      await saveClubBranding(logoUrl, color.toUpperCase() === DEFAULT_BRAND ? '' : color)
      setMessage('Desat. Ja es veu a tot el tauler i als correus.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No s’ha pogut desar.')
    } finally {
      setSaving(false)
    }
  }

  const previewStyle = (usable ? { '--brand': color } : {}) as CSSProperties

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-2">
      <div className="space-y-6 rounded-2xl border border-zinc-200 bg-white p-5">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Logo</h2>
          <div className="mt-3 flex flex-wrap items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border border-zinc-200 bg-white">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- previsualització d'un fitxer recent pujat
                <img src={logoUrl} alt="" className="h-full w-full object-contain" />
              ) : (
                <span className="text-xs text-zinc-400">Sense logo</span>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="cursor-pointer rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-100">
                {uploading ? 'Pujant…' : logoUrl ? 'Canviar logo' : 'Pujar logo'}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="sr-only"
                  disabled={uploading}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) upload(file)
                    e.target.value = ''
                  }}
                />
              </label>
              {logoUrl && (
                <button type="button" onClick={() => setLogoUrl('')} className="text-left text-xs font-semibold text-red-600">
                  Treure logo
                </button>
              )}
            </div>
          </div>
          <p className="mt-2 text-xs text-zinc-500">PNG, JPG o WebP, fins a 1 MB. Millor quadrat i amb fons transparent.</p>
        </div>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Color del club</h2>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <input
              type="color"
              value={validColor ? color : DEFAULT_BRAND}
              onChange={(e) => setColor(e.target.value)}
              className="h-10 w-14 cursor-pointer rounded-lg border border-zinc-300 bg-white"
              aria-label="Tria el color"
            />
            <input
              value={color}
              onChange={(e) => setColor(e.target.value.trim())}
              maxLength={7}
              className="w-28 rounded-lg border border-zinc-300 px-3 py-2 font-mono text-sm text-zinc-900"
              aria-label="Codi hexadecimal del color"
            />
            <button type="button" onClick={() => setColor(DEFAULT_BRAND)} className="text-xs font-semibold text-zinc-500 underline">
              Color Planter
            </button>
          </div>
          {!validColor && <p className="mt-2 text-xs text-red-600">Format: #RRGGBB</p>}
          {validColor && !usable && (
            <p className="mt-2 text-xs text-red-600">
              Massa clar: el text blanc dels botons no es llegiria. Tria un to més fosc.
            </p>
          )}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {message && <p className="text-sm text-emerald-700">{message}</p>}

        <button
          type="button"
          onClick={save}
          disabled={saving || uploading || !usable}
          className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {saving ? 'Desant…' : 'Desar canvis'}
        </button>
      </div>

      <div style={previewStyle} className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Previsualització</h2>
        <div className="mt-3 flex items-center gap-2.5">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- previsualització
            <img src={logoUrl} alt="" className="h-9 w-9 rounded-lg bg-white object-contain" />
          ) : (
            <span className="h-9 w-9 rounded-lg bg-brand-strong" />
          )}
          <div>
            <div className="text-sm font-bold text-zinc-900">{clubName}</div>
            <div className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">Planter</div>
          </div>
        </div>
        <div className="mt-4 space-y-1">
          <div className="rounded-lg bg-brand-strong px-3 py-2 text-sm font-medium text-white">Visió 360</div>
          <div className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-700">Plantilles</div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="rounded-xl bg-brand-strong px-4 py-2 text-sm font-semibold text-white">+ Nou jugador/a</span>
          <span className="text-sm font-semibold text-brand-strong underline">Veure fitxa</span>
        </div>
      </div>
    </div>
  )
}
