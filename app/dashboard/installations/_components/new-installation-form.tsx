'use client'

import { useState } from 'react'
import { createInstallation } from '../actions'

export function NewInstallationForm() {
  const [open, setOpen] = useState(false)

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-xl bg-brand-strong px-4 py-2 text-sm font-semibold text-white"
      >
        + Nova instal·lació
      </button>
    )
  }

  return (
    <form
      action={async (formData) => {
        await createInstallation(formData)
        setOpen(false)
      }}
      className="flex w-full flex-wrap items-end gap-3 rounded-2xl border border-zinc-200 bg-white p-4"
    >
      <label className="flex flex-col text-xs font-semibold uppercase text-zinc-500">
        Nom
        <input
          name="name"
          required
          placeholder="Camp Municipal 1"
          className="mt-1 w-48 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-normal normal-case text-zinc-900"
        />
      </label>
      <label className="flex min-w-56 flex-1 flex-col text-xs font-semibold uppercase text-zinc-500">
        Adreça
        <input
          name="address"
          placeholder="Carrer Major, 12, Vilassar"
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
        <button type="submit" className="rounded-xl bg-brand-strong px-4 py-2 text-sm font-semibold text-white">
          Desar
        </button>
      </div>
    </form>
  )
}
