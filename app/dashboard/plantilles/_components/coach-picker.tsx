'use client'

import { useState } from 'react'

export interface CoachOption {
  user_id: string
  full_name: string | null
  email: string
}

const inputClass = 'mt-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-normal normal-case text-zinc-900'

export function CoachPicker({ coaches, allowNone = true }: { coaches: CoachOption[]; allowNone?: boolean }) {
  const [mode, setMode] = useState<'none' | 'existing' | 'new'>(allowNone ? 'none' : coaches.length ? 'existing' : 'new')

  const radio = (value: typeof mode, label: string) => (
    <label className="flex items-center gap-1 text-sm font-normal normal-case text-zinc-700">
      <input type="radio" name="coach_mode" value={value} checked={mode === value} onChange={() => setMode(value)} />
      {label}
    </label>
  )

  return (
    <div className="flex flex-col text-xs font-semibold uppercase text-zinc-500">
      Entrenador/a
      <div className="mt-1 flex flex-wrap gap-3">
        {allowNone && radio('none', 'Més endavant')}
        {coaches.length > 0 && radio('existing', 'Existent')}
        {radio('new', 'Nou')}
      </div>

      {mode === 'existing' && (
        <select name="coach_user_id" required defaultValue="" className={inputClass + ' w-64'}>
          <option value="" disabled>
            — Tria entrenador/a —
          </option>
          {coaches.map((c) => (
            <option key={c.user_id} value={c.user_id}>
              {c.full_name ? `${c.full_name} (${c.email})` : c.email}
            </option>
          ))}
        </select>
      )}

      {mode === 'new' && (
        <div className="flex flex-wrap gap-2">
          <input name="coach_full_name" required placeholder="Nom i cognoms" className={inputClass + ' w-44'} />
          <input name="coach_email" type="email" required placeholder="correu@exemple.cat" className={inputClass + ' w-56'} />
        </div>
      )}
    </div>
  )
}
