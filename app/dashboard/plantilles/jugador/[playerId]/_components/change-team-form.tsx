'use client'

import { useState } from 'react'
import { changePlayerTeam } from '../../../actions'

export function ChangeTeamForm({ playerId, teamOptions }: { playerId: string; teamOptions: { id: string; name: string }[] }) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  if (teamOptions.length === 0) return null

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-xs font-semibold text-brand-strong hover:underline">
        Canviar d&apos;equip
      </button>
    )
  }

  return (
    <form
      action={async (formData) => {
        setSaving(true)
        try {
          await changePlayerTeam(playerId, String(formData.get('team_id') ?? ''))
          setOpen(false)
        } finally {
          setSaving(false)
        }
      }}
      className="flex flex-wrap items-center gap-2"
    >
      <select
        name="team_id"
        required
        defaultValue=""
        className="rounded-lg border border-zinc-300 px-2 py-1.5 text-sm text-zinc-900"
      >
        <option value="" disabled>
          — Nou equip —
        </option>
        {teamOptions.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-brand-strong px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
      >
        {saving ? 'Movent…' : 'Moure'}
      </button>
      <button type="button" onClick={() => setOpen(false)} className="text-xs font-semibold text-zinc-500">
        Cancel·la
      </button>
    </form>
  )
}
