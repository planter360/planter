'use client'

import { useState } from 'react'
import { createScoutedPlayer } from '../actions'
import { sportName } from '@/lib/sports'

export function NewScoutedPlayerForm({ sports }: { sports: string[] }) {
  const [open, setOpen] = useState(false)

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
      >
        + Nou jugador vigilat
      </button>
    )
  }

  return (
    <form
      action={async (formData) => {
        await createScoutedPlayer(formData)
        setOpen(false)
      }}
      className="flex w-full flex-wrap items-end gap-3 rounded-2xl border border-zinc-200 bg-white p-4"
    >
      {sports.length === 1 ? (
        <input type="hidden" name="sport" value={sports[0]} />
      ) : (
        <label className="flex flex-col text-xs font-semibold uppercase text-zinc-500">
          Esport
          <select
            name="sport"
            required
            className="mt-1 w-36 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-normal normal-case text-zinc-900"
          >
            {sports.map((s) => (
              <option key={s} value={s}>
                {sportName(s)}
              </option>
            ))}
          </select>
        </label>
      )}
      <label className="flex flex-col text-xs font-semibold uppercase text-zinc-500">
        Nom i cognoms
        <input
          name="full_name"
          required
          placeholder="Ex.: Marc Roig"
          className="mt-1 w-48 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-normal normal-case text-zinc-900"
        />
      </label>
      <label className="flex flex-col text-xs font-semibold uppercase text-zinc-500">
        Posició
        <input
          name="position"
          placeholder="Davanter"
          className="mt-1 w-32 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-normal normal-case text-zinc-900"
        />
      </label>
      <label className="flex flex-col text-xs font-semibold uppercase text-zinc-500">
        Any de naixement
        <input
          name="birth_year"
          type="number"
          placeholder="2012"
          className="mt-1 w-24 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-normal normal-case text-zinc-900"
        />
      </label>
      <label className="flex flex-col text-xs font-semibold uppercase text-zinc-500">
        Club actual
        <input
          name="current_club"
          placeholder="CE Rival"
          className="mt-1 w-36 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-normal normal-case text-zinc-900"
        />
      </label>
      <label className="flex w-full flex-col text-xs font-semibold uppercase text-zinc-500">
        Notes
        <textarea
          name="notes"
          rows={2}
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm font-normal normal-case text-zinc-900"
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
        <button type="submit" className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">
          Desar
        </button>
      </div>
    </form>
  )
}
