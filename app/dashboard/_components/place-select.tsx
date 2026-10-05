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
  // Sempre comença com a desplegable quan hi ha instal·lacions creades,
  // encara que el valor existent (dades antigues, abans d'aquest camp)
  // no hi coincideixi — en aquest cas simplement no queda res
  // pre-seleccionat, en comptes de caure silenciosament a text lliure.
  const [isOther, setIsOther] = useState(installations.length === 0)
  const matchesList = installations.some((i) => i.name === defaultValue)

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
      defaultValue={matchesList ? defaultValue : ''}
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
