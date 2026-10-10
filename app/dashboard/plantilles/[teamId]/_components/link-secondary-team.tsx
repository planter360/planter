'use client'

import { useState, useTransition } from 'react'
import { addSecondaryTeam } from '../../actions'

export function LinkSecondaryTeam({ playerId, teamOptions }: { playerId: string; teamOptions: { id: string; name: string }[] }) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  if (teamOptions.length === 0) return null

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-xs font-semibold text-brand-strong hover:underline">
        + Vincula a un altre equip
      </button>
    )
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        const teamId = new FormData(e.currentTarget).get('team_id')
        startTransition(async () => {
          await addSecondaryTeam(playerId, String(teamId ?? ''))
          setOpen(false)
        })
      }}
      className="flex items-center gap-2"
    >
      <select
        name="team_id"
        className="rounded-lg border border-zinc-300 px-2 py-1 text-xs text-zinc-900"
        defaultValue={teamOptions[0].id}
      >
        {teamOptions.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
      <button type="submit" disabled={pending} className="text-xs font-semibold text-brand-strong hover:underline disabled:opacity-60">
        Vincula
      </button>
      <button type="button" onClick={() => setOpen(false)} className="text-xs text-zinc-500 hover:underline">
        Cancel·lar
      </button>
    </form>
  )
}
