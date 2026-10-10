'use client'

import { useState } from 'react'
import { createSession } from '../actions'

export function NewSessionForm({ teamId }: { teamId: string }) {
  const [open, setOpen] = useState(false)

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-xl bg-brand-strong px-4 py-2 text-sm font-semibold text-white"
      >
        + Nova sessió
      </button>
    )
  }

  return (
    <form
      action={async (formData) => {
        const local = String(formData.get('starts_at_local') ?? '')
        // Convert in the browser, where the timezone is actually known —
        // the server (Vercel, UTC) can't tell "18:00" apart from any tz.
        const startsAtISO = local ? new Date(local).toISOString() : ''
        await createSession(teamId, {
          startsAtISO,
          place: String(formData.get('place') ?? ''),
          focus: String(formData.get('focus') ?? ''),
        })
        setOpen(false)
      }}
      className="mt-3 flex flex-wrap items-end gap-3 rounded-2xl border border-zinc-200 bg-white p-4"
    >
      <label className="flex flex-col text-xs font-semibold uppercase text-zinc-500">
        Data i hora
        <input
          name="starts_at_local"
          type="datetime-local"
          required
          className="mt-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-normal normal-case text-zinc-900"
        />
      </label>
      <label className="flex flex-col text-xs font-semibold uppercase text-zinc-500">
        Instal·lació
        <input
          name="place"
          placeholder="Camp Municipal 1"
          className="mt-1 w-44 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-normal normal-case text-zinc-900"
        />
      </label>
      <label className="flex min-w-48 flex-1 flex-col text-xs font-semibold uppercase text-zinc-500">
        Objectiu de la sessió
        <input
          name="focus"
          placeholder="Transicions defensa-atac"
          className="mt-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-normal normal-case text-zinc-900"
        />
      </label>
      <div className="ml-auto flex gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700"
        >
          Cancel·lar
        </button>
        <button type="submit" className="rounded-xl bg-brand-strong px-4 py-2 text-sm font-semibold text-white">
          Crear sessió
        </button>
      </div>
    </form>
  )
}
