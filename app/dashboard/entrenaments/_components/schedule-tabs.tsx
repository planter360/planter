'use client'

import { useState, type ReactNode } from 'react'

export function ScheduleTabs({ horaris, ocupacio }: { horaris: ReactNode; ocupacio: ReactNode }) {
  const [tab, setTab] = useState<'horaris' | 'ocupacio'>('horaris')

  return (
    <div>
      <div className="mb-4 flex gap-2">
        {(['horaris', 'ocupacio'] as const).map((id) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={
              'rounded-xl px-4 py-2 text-sm font-semibold ' +
              (tab === id ? 'bg-zinc-900 text-white' : 'border border-zinc-300 text-zinc-600')
            }
          >
            {id === 'horaris' ? 'Horaris per equip' : "Ocupació d'instal·lacions"}
          </button>
        ))}
      </div>
      {tab === 'horaris' ? horaris : ocupacio}
    </div>
  )
}
