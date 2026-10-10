'use client'

import { useState } from 'react'
import { createMatch } from '../actions'
import { PlaceSelect } from '../../_components/place-select'
import type { Installation } from '@/lib/installations'

export function NewMatchForm({
  teams,
  installations,
}: {
  teams: { id: string; name: string }[]
  installations: Installation[]
}) {
  const [open, setOpen] = useState(false)
  const [home, setHome] = useState(true)

  if (teams.length === 0) return null

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="rounded-xl bg-brand-strong px-4 py-2 text-sm font-semibold text-white">
        + Nou partit
      </button>
    )
  }

  return (
    <form
      action={async (formData) => {
        const teamId = String(formData.get('team_id') ?? teams[0].id)
        const local = String(formData.get('starts_at_local') ?? '')
        const startsAtISO = local ? new Date(local).toISOString() : ''
        await createMatch(teamId, {
          rival: String(formData.get('rival') ?? ''),
          startsAtISO,
          place: String(formData.get('place') ?? ''),
          placeAddress: home ? '' : String(formData.get('place_address') ?? ''),
        })
        setOpen(false)
      }}
      className="mt-3 flex flex-wrap items-end gap-3 rounded-2xl border border-zinc-200 bg-white p-4"
    >
      {teams.length > 1 ? (
        <label className="flex flex-col text-xs font-semibold uppercase text-zinc-500">
          Equip
          <select
            name="team_id"
            className="mt-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-normal normal-case text-zinc-900"
          >
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <input type="hidden" name="team_id" value={teams[0].id} />
      )}
      <label className="flex flex-col text-xs font-semibold uppercase text-zinc-500">
        Rival
        <input
          name="rival"
          required
          placeholder="Ex.: UE Mar"
          className="mt-1 w-40 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-normal normal-case text-zinc-900"
        />
      </label>
      <label className="flex flex-col text-xs font-semibold uppercase text-zinc-500">
        Data i hora
        <input
          name="starts_at_local"
          type="datetime-local"
          className="mt-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-normal normal-case text-zinc-900"
        />
      </label>
      <div className="flex flex-col text-xs font-semibold uppercase text-zinc-500">
        Partit
        <div className="mt-1 flex gap-3 normal-case">
          <label className="flex items-center gap-1 text-sm font-normal text-zinc-700">
            <input type="radio" checked={home} onChange={() => setHome(true)} /> Local
          </label>
          <label className="flex items-center gap-1 text-sm font-normal text-zinc-700">
            <input type="radio" checked={!home} onChange={() => setHome(false)} /> Visitant
          </label>
        </div>
      </div>
      {home ? (
        <label className="flex flex-col text-xs font-semibold uppercase text-zinc-500">
          Lloc
          <PlaceSelect
            name="place"
            installations={installations}
            placeholder="Camp Municipal 1"
            className="w-44 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-normal normal-case text-zinc-900"
          />
        </label>
      ) : (
        <>
          <label className="flex flex-col text-xs font-semibold uppercase text-zinc-500">
            Lloc
            <input
              name="place"
              placeholder="Camp del rival"
              className="mt-1 w-40 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-normal normal-case text-zinc-900"
            />
          </label>
          <label className="flex flex-col text-xs font-semibold uppercase text-zinc-500">
            Adreça
            <input
              name="place_address"
              placeholder="Carrer, ciutat"
              className="mt-1 w-44 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-normal normal-case text-zinc-900"
            />
          </label>
        </>
      )}
      <div className="ml-auto flex gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700"
        >
          Cancel·lar
        </button>
        <button type="submit" className="rounded-xl bg-brand-strong px-4 py-2 text-sm font-semibold text-white">
          Crear partit
        </button>
      </div>
    </form>
  )
}
