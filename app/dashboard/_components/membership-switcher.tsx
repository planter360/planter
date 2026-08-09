'use client'

import { useTransition } from 'react'
import { setActiveMembership } from '../actions'
import { ROLE_LABELS } from '@/lib/access'
import type { Membership } from '@/lib/membership'

export function MembershipSwitcher({
  memberships,
  activeId,
}: {
  memberships: Membership[]
  activeId: string
}) {
  const [pending, startTransition] = useTransition()

  if (memberships.length <= 1) return null

  return (
    <select
      value={activeId}
      disabled={pending}
      onChange={(e) => startTransition(() => setActiveMembership(e.target.value))}
      className="w-full rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-xs text-zinc-700 disabled:opacity-60"
    >
      {memberships.map((m) => (
        <option key={m.id} value={m.id}>
          {ROLE_LABELS[m.role]} · {m.clubName}
        </option>
      ))}
    </select>
  )
}
