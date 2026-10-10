'use client'

import { useState } from 'react'
import { addObservation } from '../actions'

const STATUS_OPTIONS = [
  { value: 'interessant', label: 'Interessant' },
  { value: 'a_seguir', label: 'A seguir' },
  { value: 'fitxat', label: 'Fitxat' },
  { value: 'descartat', label: 'Descartat' },
]

const SCORE_FIELDS = [
  { name: 'tec', label: 'Tècnica' },
  { name: 'fis', label: 'Físic' },
  { name: 'tac', label: 'Tàctic' },
  { name: 'men', label: 'Mental' },
]

export function ObservationForm({ scoutedPlayerId }: { scoutedPlayerId: string }) {
  const [open, setOpen] = useState(false)

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs font-semibold text-brand-strong underline underline-offset-2"
      >
        + Afegeix observació
      </button>
    )
  }

  return (
    <form
      action={async (formData) => {
        await addObservation(scoutedPlayerId, formData)
        setOpen(false)
      }}
      className="flex flex-wrap items-end gap-2 rounded-xl bg-zinc-50 p-3"
    >
      <label className="flex flex-col text-xs font-semibold uppercase text-zinc-500">
        Estat
        <select
          name="status"
          defaultValue="a_seguir"
          className="mt-1 rounded-lg border border-zinc-300 px-2 py-1.5 text-sm font-normal normal-case text-zinc-900"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col text-xs font-semibold uppercase text-zinc-500">
        Data
        <input
          name="observed_at"
          type="date"
          className="mt-1 rounded-lg border border-zinc-300 px-2 py-1.5 text-sm font-normal normal-case text-zinc-900"
        />
      </label>
      {SCORE_FIELDS.map((f) => (
        <label key={f.name} className="flex flex-col text-xs font-semibold uppercase text-zinc-500">
          {f.label}
          <select
            name={f.name}
            defaultValue=""
            className="mt-1 w-16 rounded-lg border border-zinc-300 px-2 py-1.5 text-sm font-normal normal-case text-zinc-900"
          >
            <option value="">—</option>
            {[1, 2, 3, 4, 5].map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </label>
      ))}
      <label className="flex min-w-48 flex-1 flex-col text-xs font-semibold uppercase text-zinc-500">
        Notes
        <input
          name="notes"
          placeholder="Què vas veure?"
          className="mt-1 rounded-lg border border-zinc-300 px-2 py-1.5 text-sm font-normal normal-case text-zinc-900"
        />
      </label>
      <button type="submit" className="rounded-lg bg-brand-strong px-3 py-1.5 text-xs font-semibold text-white">
        Desa
      </button>
      <button type="button" onClick={() => setOpen(false)} className="text-xs font-semibold text-zinc-500">
        Cancel·la
      </button>
    </form>
  )
}
