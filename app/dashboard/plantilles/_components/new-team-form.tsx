'use client'

import { useState } from 'react'
import { createTeam } from '../actions'
import { TEAM_GENDERS } from '@/lib/teams'
import { CoachPicker, type CoachOption } from './coach-picker'

export function NewTeamForm({ sectionLabel, coaches }: { sectionLabel: string; coaches: CoachOption[] }) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')
  const [warning, setWarning] = useState(false)
  const [error, setError] = useState('')

  if (!open) {
    return (
      <div className="flex flex-col items-end gap-2">
        <button
          onClick={() => {
            setOpen(true)
            setNotice('')
          }}
          className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white"
        >
          + Nou equip
        </button>
        {notice && (
          <p
            className={
              'max-w-md text-right text-xs ' +
              (warning ? 'rounded-lg bg-amber-50 px-2 py-1 text-amber-800' : 'text-emerald-700')
            }
          >
            {notice}
          </p>
        )}
      </div>
    )
  }

  return (
    <form
      action={async (formData) => {
        setSaving(true)
        setError('')
        try {
          const result = await createTeam(formData)
          setNotice(result.notice ?? '')
          setWarning(Boolean(result.warning))
          setOpen(false)
        } catch (e) {
          setError(e instanceof Error ? e.message : 'No s’ha pogut crear l’equip.')
        } finally {
          setSaving(false)
        }
      }}
      className="flex w-full flex-wrap items-end gap-3 rounded-2xl border border-zinc-200 bg-white p-4"
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
      <CoachPicker coaches={coaches} />
      <div className="text-xs text-zinc-500">
        Secció: <span className="font-semibold text-zinc-700">{sectionLabel}</span>
      </div>
      {error && <p className="w-full text-sm text-red-600">{error}</p>}
      <div className="ml-auto flex gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700"
        >
          Cancel·lar
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-brand-strong px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {saving ? 'Creant…' : 'Crear equip'}
        </button>
      </div>
    </form>
  )
}
