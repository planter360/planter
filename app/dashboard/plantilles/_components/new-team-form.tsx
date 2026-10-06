'use client'

import { useState } from 'react'
import { createTeam } from '../actions'
import { TEAM_GENDERS } from '@/lib/teams'

export function NewTeamForm({ sectionLabel }: { sectionLabel: string }) {
  const [open, setOpen] = useState(false)

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white"
      >
        + Nou equip
      </button>
    )
  }

  return (
    <form
      action={async (formData) => {
        await createTeam(formData)
        setOpen(false)
      }}
      className="flex flex-wrap items-end gap-3 rounded-2xl border border-zinc-200 bg-white p-4"
    >
      <label className="flex flex-col text-xs font-semibold uppercase text-zinc-500">
        Nom de l&apos;equip
        <input
          name="name"
          required
          placeholder="Ex.: Infantil B"
          className="mt-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-normal normal-case text-zinc-900"
        />
      </label>
      <label className="flex flex-col text-xs font-semibold uppercase text-zinc-500">
        Categoria
        <select
          name="gender"
          required
          defaultValue=""
          className="mt-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-normal normal-case text-zinc-900"
        >
          <option value="" disabled>
            — Tria —
          </option>
          {TEAM_GENDERS.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col text-xs font-semibold uppercase text-zinc-500">
        Entrenador/a
        <input
          name="coach_name"
          placeholder="Nom"
          className="mt-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-normal normal-case text-zinc-900"
        />
      </label>
      <div className="text-xs text-zinc-500">
        Secció: <span className="font-semibold text-zinc-700">{sectionLabel}</span>
      </div>
      <div className="ml-auto flex gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700"
        >
          Cancel·lar
        </button>
        <button type="submit" className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">
          Crear equip
        </button>
      </div>
    </form>
  )
}
