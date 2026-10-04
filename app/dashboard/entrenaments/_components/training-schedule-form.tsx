'use client'

import { useState } from 'react'
import { saveTrainingSchedule } from '../actions'
import { DayPicker } from './day-picker'

export function TrainingScheduleForm({
  teamId,
  initialDays,
  initialTime,
  initialPlace,
  initialRainPlace,
}: {
  teamId: string
  initialDays: string[]
  initialTime: string
  initialPlace: string
  initialRainPlace: string
}) {
  const [open, setOpen] = useState(false)

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-xs font-semibold text-emerald-700 hover:underline">
        {initialTime ? 'Editar horari' : 'Definir horari setmanal'}
      </button>
    )
  }

  return (
    <form
      action={async (formData) => {
        await saveTrainingSchedule(teamId, formData)
        setOpen(false)
      }}
      className="mt-3 flex flex-wrap items-end gap-3 rounded-2xl border border-zinc-200 bg-white p-4"
    >
      <div className="flex flex-col text-xs font-semibold uppercase text-zinc-500">
        Dies
        <div className="mt-1">
          <DayPicker name="days" defaultValue={initialDays} />
        </div>
      </div>
      <label className="flex flex-col text-xs font-semibold uppercase text-zinc-500">
        Horari
        <input
          name="time_txt"
          defaultValue={initialTime}
          placeholder="18.00 - 19.30"
          className="mt-1 w-40 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-normal normal-case text-zinc-900"
        />
      </label>
      <label className="flex flex-col text-xs font-semibold uppercase text-zinc-500">
        Instal·lació
        <input
          name="place"
          defaultValue={initialPlace}
          placeholder="Camp Municipal 1"
          className="mt-1 w-48 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-normal normal-case text-zinc-900"
        />
      </label>
      <label className="flex flex-col text-xs font-semibold uppercase text-zinc-500">
        Lloc alternatiu (pla de pluja)
        <input
          name="rain_place"
          defaultValue={initialRainPlace}
          placeholder="Pavelló cobert"
          className="mt-1 w-48 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-normal normal-case text-zinc-900"
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
