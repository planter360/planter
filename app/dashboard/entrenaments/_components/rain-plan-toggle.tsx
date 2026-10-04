'use client'

import { useTransition } from 'react'
import { setRainPlan } from '../actions'

export function RainPlanToggle({
  teamId,
  rainPlace,
  rainActive,
}: {
  teamId: string
  rainPlace: string | null
  rainActive: boolean
}) {
  const [pending, startTransition] = useTransition()

  if (!rainPlace) return null

  return (
    <button
      disabled={pending}
      onClick={() => startTransition(() => setRainPlan(teamId, !rainActive))}
      className={
        'rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-60 ' +
        (rainActive ? 'bg-blue-100 text-blue-800' : 'border border-zinc-300 text-zinc-600')
      }
    >
      {rainActive ? `Pla de pluja actiu · ${rainPlace} (desactivar)` : 'Activa el pla de pluja'}
    </button>
  )
}
