'use client'

import { useState } from 'react'
import { createPlayer } from '../../actions'

export function NewPlayerForm({ teamId }: { teamId: string }) {
  const [open, setOpen] = useState(false)

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-xl bg-brand-strong px-4 py-2 text-sm font-semibold text-white"
      >
        + Nou jugador/a
      </button>
    )
  }

  return (
    <form
      action={async (formData) => {
        await createPlayer(teamId, formData)
        setOpen(false)
      }}
      className="flex flex-wrap items-end gap-3 rounded-2xl border border-zinc-200 bg-white p-4"
    >
      <label className="flex flex-col text-xs font-semibold uppercase text-zinc-500">
        Nom i cognoms
        <input
          name="full_name"
          required
          placeholder="Ex.: Arnau Vila"
          className="mt-1 w-48 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-normal normal-case text-zinc-900"
        />
      </label>
      <label className="flex flex-col text-xs font-semibold uppercase text-zinc-500">
        Dorsal
        <input
          name="dorsal"
          type="number"
          placeholder="14"
          className="mt-1 w-20 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-normal normal-case text-zinc-900"
        />
      </label>
      <label className="flex flex-col text-xs font-semibold uppercase text-zinc-500">
        Posició
        <input
          name="position"
          placeholder="Defensa"
          className="mt-1 w-32 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-normal normal-case text-zinc-900"
        />
      </label>
      <label className="flex flex-col text-xs font-semibold uppercase text-zinc-500">
        Any de naixement
        <input
          name="birth_year"
          type="number"
          placeholder="2013"
          className="mt-1 w-24 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-normal normal-case text-zinc-900"
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
          Donar d&apos;alta
        </button>
      </div>
    </form>
  )
}
