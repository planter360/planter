'use client'

import { useTransition } from 'react'
import { setConfirmed } from '../actions'

export function ConfirmAvailability({
  matchId,
  playerId,
  confirmed,
}: {
  matchId: string
  playerId: string
  confirmed: boolean | null
}) {
  const [pending, startTransition] = useTransition()

  return (
    <div className="flex gap-2">
      <button
        disabled={pending}
        onClick={() => startTransition(() => setConfirmed(matchId, playerId, true))}
        className={
          'rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-60 ' +
          (confirmed === true ? 'bg-emerald-100 text-emerald-800' : 'border border-zinc-300 text-zinc-600')
        }
      >
        Hi anirà
      </button>
      <button
        disabled={pending}
        onClick={() => startTransition(() => setConfirmed(matchId, playerId, false))}
        className={
          'rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-60 ' +
          (confirmed === false ? 'bg-red-100 text-red-800' : 'border border-zinc-300 text-zinc-600')
        }
      >
        No hi podrà anar
      </button>
    </div>
  )
}
