'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from '../actions'
import { MembershipSwitcher } from './membership-switcher'
import { ROLE_LABELS, type ModuleDef, type Role } from '@/lib/access'
import type { Membership } from '@/lib/membership'

export function Sidebar({
  modules,
  clubName,
  role,
  userEmail,
  memberships,
  activeMembershipId,
}: {
  modules: ModuleDef[]
  clubName: string
  role: Role
  userEmail: string
  memberships: Membership[]
  activeMembershipId: string
}) {
  const pathname = usePathname()

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-zinc-200 bg-zinc-50 p-4">
      <div className="mb-6 px-1">
        <div className="text-lg font-bold text-zinc-900">Planter</div>
        <div className="text-xs text-zinc-500">{clubName}</div>
      </div>

      <nav className="flex-1 space-y-1">
        {modules.map((m) => {
          const active = pathname === m.href
          return (
            <Link
              key={m.id}
              href={m.href}
              className={
                'block rounded-lg px-3 py-2 text-sm font-medium ' +
                (active ? 'bg-zinc-900 text-white' : 'text-zinc-700 hover:bg-zinc-200')
              }
            >
              {m.label}
            </Link>
          )
        })}
      </nav>

      <div className="mt-6 space-y-3 border-t border-zinc-200 pt-4">
        <MembershipSwitcher memberships={memberships} activeId={activeMembershipId} />
        <div className="px-1 text-xs text-zinc-500">
          <div className="font-medium text-zinc-700">{ROLE_LABELS[role]}</div>
          <div className="truncate">{userEmail}</div>
        </div>
        <form action={signOut}>
          <button className="px-1 text-xs font-medium text-zinc-500 underline hover:text-zinc-800">
            Tanca sessió
          </button>
        </form>
      </div>
    </aside>
  )
}
