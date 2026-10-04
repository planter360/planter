'use client'

import { useState } from 'react'
import { saveMatchPlan } from '../actions'

export function MatchPlanEditor({
  matchId,
  initialContent,
  initialLinkedIds,
  candidatePlayers,
}: {
  matchId: string
  initialContent: string
  initialLinkedIds: string[]
  candidatePlayers: { id: string; full_name: string }[]
}) {
  const [open, setOpen] = useState(Boolean(initialContent))
  const [content, setContent] = useState(initialContent)
  const [linkedIds, setLinkedIds] = useState<string[]>(initialLinkedIds)
  const [saving, setSaving] = useState(false)

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-3 text-xs font-semibold text-emerald-700 underline underline-offset-2"
      >
        + Afegeix pla de partit
      </button>
    )
  }

  const toggle = (id: string) => {
    setLinkedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  return (
    <div className="mt-3 space-y-2 border-t border-zinc-100 pt-3">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        placeholder="Punts forts/febles del rival, jugadors clau, pla de partit…"
        className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
      />
      {candidatePlayers.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase text-zinc-500">Jugadors vigilats relacionats</p>
          <div className="mt-1 flex flex-wrap gap-2">
            {candidatePlayers.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => toggle(p.id)}
                className={
                  'rounded-full px-3 py-1 text-xs font-semibold ' +
                  (linkedIds.includes(p.id) ? 'bg-emerald-600 text-white' : 'bg-zinc-100 text-zinc-600')
                }
              >
                {p.full_name}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="flex justify-end gap-2">
        <button
          disabled={saving}
          onClick={async () => {
            setSaving(true)
            await saveMatchPlan(matchId, content, linkedIds)
            setSaving(false)
          }}
          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
        >
          {saving ? 'Desant…' : 'Desa el pla'}
        </button>
      </div>
    </div>
  )
}
