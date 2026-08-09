'use client'

import { useState } from 'react'
import { DAYS } from '@/lib/schedule'

export function DayPicker({ name, defaultValue }: { name: string; defaultValue: string[] }) {
  const [selected, setSelected] = useState<string[]>(defaultValue)

  const toggle = (code: string) =>
    setSelected((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]))

  return (
    <div className="flex flex-wrap gap-1.5">
      {DAYS.map(([code, label]) => (
        <button
          key={code}
          type="button"
          title={label}
          onClick={() => toggle(code)}
          className={
            'rounded-lg px-2.5 py-1.5 text-xs font-bold ' +
            (selected.includes(code) ? 'bg-zinc-900 text-white' : 'border border-zinc-300 text-zinc-600')
          }
        >
          {code}
        </button>
      ))}
      {selected.map((code) => (
        <input key={code} type="hidden" name={name} value={code} />
      ))}
    </div>
  )
}
