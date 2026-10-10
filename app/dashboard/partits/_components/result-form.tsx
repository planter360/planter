'use client'

import { useState } from 'react'
import { setMatchResult, deleteMatch } from '../actions'

export function ResultForm({ matchId, status, result }: { matchId: string; status: string; result: string | null }) {
  const [open, setOpen] = useState(false)

  if (!open) {
    return (
      <div className="flex gap-3">
        <button onClick={() => setOpen(true)} className="text-xs font-semibold text-brand-strong hover:underline">
          {status === 'jugat' ? 'Editar resultat' : 'Registrar resultat'}
        </button>
        <button
          onClick={async () => {
            if (confirm('Eliminar aquest partit?')) await deleteMatch(matchId)
          }}
          className="text-xs font-semibold text-red-600 hover:underline"
        >
          Eliminar
        </button>
      </div>
    )
  }

  return (
    <form
      action={async (formData) => {
        await setMatchResult(matchId, formData)
        setOpen(false)
      }}
      className="flex flex-wrap items-end gap-3 rounded-xl bg-zinc-50 p-3"
    >
      <label className="flex flex-col text-xs font-semibold uppercase text-zinc-500">
        Estat
        <select
          name="status"
          defaultValue={status}
          className="mt-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-normal normal-case text-zinc-900"
        >
          <option value="convocatoria">Convocatòria oberta</option>
          <option value="convocat">Convocats enviats</option>
          <option value="jugat">Jugat</option>
          <option value="suspes">Suspès</option>
        </select>
      </label>
      <label className="flex flex-col text-xs font-semibold uppercase text-zinc-500">
        Resultat
        <input
          name="result"
          defaultValue={result ?? ''}
          placeholder="3 - 1"
          className="mt-1 w-28 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-normal normal-case text-zinc-900"
        />
      </label>
      <div className="ml-auto flex gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-xl border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700"
        >
          Cancel·lar
        </button>
        <button type="submit" className="rounded-xl bg-brand-strong px-3 py-1.5 text-xs font-semibold text-white">
          Desar
        </button>
      </div>
    </form>
  )
}
