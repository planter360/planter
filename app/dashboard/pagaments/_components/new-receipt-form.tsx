'use client'

import { useState } from 'react'
import { createReceipt } from '../actions'

export interface PlayerOption {
  id: string
  full_name: string
  team_name: string
}

export function NewReceiptForm({ players }: { players: PlayerOption[] }) {
  const [open, setOpen] = useState(false)

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white">
        + Nou rebut
      </button>
    )
  }

  return (
    <form
      action={async (formData) => {
        await createReceipt(formData)
        setOpen(false)
      }}
      className="flex flex-wrap items-end gap-3 rounded-2xl border border-zinc-200 bg-white p-4"
    >
      <label className="flex flex-col text-xs font-semibold uppercase text-zinc-500">
        Jugador/a
        <select
          name="player_id"
          required
          className="mt-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-normal normal-case text-zinc-900"
        >
          {players.map((p) => (
            <option key={p.id} value={p.id}>
              {p.full_name} · {p.team_name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col text-xs font-semibold uppercase text-zinc-500">
        Concepte
        <input
          name="concept"
          required
          placeholder="Quota agost 2026"
          className="mt-1 w-52 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-normal normal-case text-zinc-900"
        />
      </label>
      <label className="flex flex-col text-xs font-semibold uppercase text-zinc-500">
        Import (€)
        <input
          name="amount"
          type="number"
          step="0.01"
          min="0"
          required
          placeholder="45"
          className="mt-1 w-28 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-normal normal-case text-zinc-900"
        />
      </label>
      <label className="flex flex-col text-xs font-semibold uppercase text-zinc-500">
        Venciment
        <input
          name="due_date"
          type="date"
          required
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
        <button type="submit" className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">
          Emetre rebut
        </button>
      </div>
    </form>
  )
}
