'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Logomark } from '@/components/Logomark'
import { usePathname } from 'next/navigation'
import { signOut } from '../actions'
import { MembershipSwitcher } from './membership-switcher'
import { ROLE_LABELS, type ModuleDef, type Role } from '@/lib/access'
import type { Membership } from '@/lib/membership'

function isActive(pathname: string, href: string): boolean {
  if (href === '/dashboard') return pathname === href
  return pathname === href || pathname.startsWith(href + '/')
}

export function Sidebar({
  modules,
  clubName,
  clubLogoUrl,
  role,
  userEmail,
  memberships,
  activeMembershipId,
}: {
  modules: ModuleDef[]
  clubName: string
  clubLogoUrl: string | null
  role: Role
  userEmail: string
  memberships: Membership[]
  activeMembershipId: string
}) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const content = (
    <>
      <nav className="flex-1 space-y-1">
        {modules.map((m) => (
          <Link
            key={m.id}
            href={m.href}
            onClick={() => setOpen(false)}
            className={
              'block rounded-lg px-3 py-2.5 text-sm font-medium md:py-2 ' +
              (isActive(pathname, m.href) ? 'bg-brand-strong text-white' : 'text-zinc-700 hover:bg-zinc-200')
            }
          >
            {m.label}
          </Link>
        ))}
      </nav>

      <div className="mt-6 space-y-3 border-t border-zinc-200 pt-4">
        <MembershipSwitcher memberships={memberships} activeId={activeMembershipId} />
        <div className="px-1 text-xs text-zinc-500">
          <div className="font-medium text-zinc-700">{ROLE_LABELS[role]}</div>
          <div className="truncate">{userEmail}</div>
        </div>
        <form action={signOut}>
          <button className="px-1 text-xs font-medium text-zinc-500 underline hover:text-zinc-800">Tanca sessió</button>
        </form>
      </div>
    </>
  )

  // Co-marca: el club en primer pla, Planter com a plataforma.
  const brand = (
    <div className="flex min-w-0 items-center gap-2.5">
      {clubLogoUrl ? (
        <Image
          src={clubLogoUrl}
          alt=""
          width={36}
          height={36}
          className="h-9 w-9 shrink-0 rounded-lg bg-white object-contain"
        />
      ) : (
        <Logomark size={36} />
      )}
      <div className="min-w-0">
        <div className="truncate text-sm font-bold text-zinc-900">{clubName}</div>
        <div className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">Planter</div>
      </div>
    </div>
  )

  return (
    <>
      {/* Mòbil: barra superior amb menú desplegable */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-zinc-200 bg-zinc-50 px-4 py-3 md:hidden">
        {brand}
        <button
          onClick={() => setOpen(true)}
          aria-label="Obre el menú"
          aria-expanded={open}
          className="rounded-lg border border-zinc-300 p-2 text-zinc-700"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
      </header>

      {open && (
        <div className="fixed inset-0 z-40 md:hidden" role="dialog" aria-modal="true">
          <button aria-label="Tanca el menú" onClick={() => setOpen(false)} className="absolute inset-0 bg-black/40" />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col overflow-y-auto bg-zinc-50 p-4 shadow-xl">
            <div className="mb-6 flex items-start justify-between gap-3 px-1">
              {brand}
              <button
                onClick={() => setOpen(false)}
                aria-label="Tanca el menú"
                className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-200"
              >
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
            {content}
          </aside>
        </div>
      )}

      {/* Escriptori: barra lateral fixa */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-zinc-200 bg-zinc-50 p-4 md:flex">
        <div className="mb-6 px-1">{brand}</div>
        {content}
      </aside>
    </>
  )
}
