'use client'

import { useTransition } from 'react'
import { toggleFamilyNotified } from '../actions'

export function FamilyAbsenceToggle({
  sessionId,
  playerId,
  notified,
}: {
  sessionId: string
  playerId: string
  notified: boolean
}) {
  const [pending, startTransition] = useTransition()

  return (
    <button
      disabled={pending}
      onClick={() => startTransition(() => toggleFamilyNotified(sessionId, playerId, notified))}
      className={
        'shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-60 ' +
        (notified ? 'bg-amber-100 text-amber-800' : 'border border-zinc-300 text-zinc-600')
      }
    >
      {notified ? 'Absència notificada · desfer' : 'Notificar absència'}
    </button>
  )
}
