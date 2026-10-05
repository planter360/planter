'use client'

import { useState } from 'react'
import type { Installation } from '@/lib/installations'

// Desplegable d'instal·lacions del club, amb una opció "Altra" que
// revela un camp de text lliure — per quan el lloc encara no és a la
// llista o és fora del club (p.ex. camp del rival a Partits).
export function PlaceSelect({
  name,
  installations,
  defaultValue,
  placeholder,
  className,
}: {
  name: string
  installations: Installation[]
  defaultValue?: string
  placeholder?: string
  className?: string
}) {
  const matchesList = installations.some((i) => i.name === defaultValue)
  const [isOther, setIsOther] = useState(Boolean(defaultValue) ? !matchesList : installations.length === 0)

  if (isOther) {
    return (
      <div className="flex items-center gap-2">
        <input name={name} defaultValue={defaultValue} placeholder={placeholder} className={className} />
        {installations.length > 0 && (
          <button type="button" onClick={() => setIsOther(false)} className="shrink-0 text-xs text-zinc-500 underline">
            Tria de la llista
          </button>
        )}
      </div>
    )
  }

  return (
    <select
      name={name}
      defaultValue={defaultValue || ''}
      onChange={(e) => {
        if (e.target.value === '__other__') setIsOther(true)
      }}
      className={className}
    >
      <option value="">— Selecciona —</option>
      {installations.map((i) => (
        <option key={i.id} value={i.name}>
          {i.name}
        </option>
      ))}
      <option value="__other__">Altra (especifica)…</option>
    </select>
  )
}
