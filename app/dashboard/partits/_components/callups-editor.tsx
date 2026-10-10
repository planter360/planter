'use client'

import { useState, useTransition } from 'react'
import { saveCallups } from '../actions'
import type { SquadMember } from '@/lib/squad'

export function CallupsEditor({
  matchId,
  squad,
  calledUpIds,
}: {
  matchId: string
  squad: SquadMember[]
  calledUpIds: string[]
}) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set(calledUpIds))
  const [pending, startTransition] = useTransition()

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-xs font-semibold text-brand-strong hover:underline">
        {calledUpIds.length > 0 ? 'Editar convocatòria' : 'Fer la convocatòria'}
      </button>
    )
  }

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="mt-3 rounded-xl bg-zinc-50 p-3">
      {squad.length === 0 ? (
        <p className="text-sm text-zinc-600">L&apos;equip encara no té jugadors donats d&apos;alta.</p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {squad.map((p) => {
            const isSelected = selected.has(p.id)
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => toggle(p.id)}
                className={
                  'flex items-center gap-3 rounded-xl px-3 py-2 text-left ' +
                  (isSelected ? 'border border-emerald-200 bg-emerald-50' : 'border border-zinc-200 bg-white')
                }
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-xs font-bold text-white">
                  {p.dorsal ?? '–'}
                </span>
                <span className="flex-1 text-sm font-medium text-zinc-900">{p.full_name}</span>
                <span className={'text-xs font-bold ' + (isSelected ? 'text-emerald-700' : 'text-zinc-400')}>
                  {isSelected ? 'CONVOCAT' : '—'}
                </span>
              </button>
            )
          })}
        </div>
      )}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-semibold text-zinc-700">{selected.size} convocats</span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-xl border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700"
          >
            Cancel·lar
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await saveCallups(matchId, [...selected])
                setOpen(false)
              })
            }
            className="rounded-xl bg-brand-strong px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
          >
            Enviar convocatòria
          </button>
        </div>
      </div>
    </div>
  )
}
