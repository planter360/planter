'use client'

import { useState } from 'react'
import { createAssessment } from '../actions'

const SCALE = [1, 2, 3, 4, 5]
const FIELDS = [
  { name: 'tec', label: 'Tècnica' },
  { name: 'fis', label: 'Físic' },
  { name: 'tac', label: 'Tàctic' },
  { name: 'men', label: 'Mental' },
]

export function AssessmentForm({ playerId }: { playerId: string }) {
  const [open, setOpen] = useState(false)

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-3 text-xs font-semibold text-brand-strong underline underline-offset-2"
      >
        + Nova valoració
      </button>
    )
  }

  return (
    <form
      action={async (formData) => {
        await createAssessment(playerId, formData)
        setOpen(false)
      }}
      className="mt-3 flex flex-wrap items-end gap-3 rounded-xl bg-zinc-50 p-3"
    >
      {FIELDS.map((f) => (
        <label key={f.name} className="flex flex-col text-xs font-semibold uppercase text-zinc-500">
          {f.label}
          <select
            name={f.name}
            defaultValue="3"
            required
            className="mt-1 w-16 rounded-lg border border-zinc-300 px-2 py-1.5 text-sm font-normal normal-case text-zinc-900"
          >
            {SCALE.map((v) => (
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
          placeholder="Observacions del trimestre"
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
