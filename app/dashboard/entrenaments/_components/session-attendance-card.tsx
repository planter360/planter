'use client'

import { useTransition } from 'react'
import { toggleAttendance, deleteSession } from '../actions'
import { formatDateTime } from '@/lib/format'
import type { SquadMember } from '@/lib/squad'

export function SessionAttendanceCard({
  session,
  squad,
  attendance,
}: {
  session: { id: string; starts_at: string; place: string | null; focus: string | null }
  squad: SquadMember[]
  attendance: Record<string, boolean>
}) {
  const [pending, startTransition] = useTransition()
  const presentCount = squad.filter((p) => attendance[p.id] !== false).length

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="font-semibold text-zinc-900">{formatDateTime(session.starts_at)}</div>
          <div className="text-xs text-zinc-500">
            {session.place ?? 'Lloc per confirmar'}
            {session.focus ? ` · ${session.focus}` : ''}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            {presentCount}/{squad.length} presents
          </span>
          <button
            onClick={async () => {
              if (confirm('Eliminar aquesta sessió?')) await deleteSession(session.id)
            }}
            className="text-xs font-semibold text-red-600 hover:underline"
          >
            Eliminar
          </button>
        </div>
      </div>

      {squad.length === 0 ? (
        <p className="mt-3 text-sm text-zinc-600">L&apos;equip encara no té jugadors donats d&apos;alta.</p>
      ) : (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {squad.map((p) => {
            const present = attendance[p.id] !== false
            return (
              <button
                key={p.id}
                disabled={pending}
                onClick={() => startTransition(() => toggleAttendance(session.id, p.id, present))}
                className={
                  'flex items-center gap-3 rounded-xl px-3 py-2 text-left disabled:opacity-60 ' +
                  (present ? 'border border-emerald-200 bg-emerald-50' : 'border border-red-200 bg-red-50')
                }
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-xs font-bold text-white">
                  {p.dorsal ?? '–'}
                </span>
                <span className="flex-1 text-sm font-medium text-zinc-900">{p.full_name}</span>
                <span className={'text-xs font-bold ' + (present ? 'text-emerald-700' : 'text-red-700')}>
                  {present ? 'PRESENT' : 'ABSENT'}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
