'use client'

import { useMemo, useState } from 'react'
import { createPlayersBulk } from '../../actions'
import type { BulkPlayerRow } from '@/lib/teams'

// Una línia per jugador: "Nom; Dorsal; Posició; Any". També accepta
// files copiades d'un full de càlcul (separades per tabulador) o comes.
function parseLines(text: string): BulkPlayerRow[] {
  const toInt = (v: string | undefined) => {
    const n = Number((v ?? '').trim())
    return v && v.trim() && Number.isInteger(n) ? n : null
  }
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = /[\t;]/.test(line) ? line.split(/[\t;]/) : line.split(',')
      return {
        full_name: (parts[0] ?? '').trim(),
        dorsal: toInt(parts[1]),
        position: (parts[2] ?? '').trim() || null,
        birth_year: toInt(parts[3]),
      }
    })
    .filter((r, i) => r.full_name && !(i === 0 && r.full_name.toLowerCase() === 'nom'))
}

export function BulkPlayersForm({ teamId }: { teamId: string }) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const rows = useMemo(() => parseLines(text), [text])

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-100"
      >
        + Alta múltiple
      </button>
    )
  }

  const save = async () => {
    setSaving(true)
    setError('')
    try {
      await createPlayersBulk(teamId, rows)
      setText('')
      setOpen(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No s’han pogut desar els jugadors.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="w-full rounded-2xl border border-zinc-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase text-zinc-500">Alta múltiple de jugadors</p>
      <p className="mt-1 text-xs text-zinc-500">
        Un jugador per línia: <span className="font-mono">Nom i cognoms; Dorsal; Posició; Any de naixement</span>. Només el nom és
        obligatori. També pots enganxar files copiades directament d&apos;un full de càlcul.
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={6}
        placeholder={'Arnau Vila; 7; Davanter; 2013\nMarta Puig; 4; Defensa; 2013\nPau Serra'}
        className="mt-2 w-full rounded-lg border border-zinc-300 px-3 py-2 font-mono text-sm text-zinc-900"
      />

      {rows.length > 0 && (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-zinc-500">
              <tr>
                <th className="py-1 pr-3">Nom</th>
                <th className="py-1 pr-3">Dorsal</th>
                <th className="py-1 pr-3">Posició</th>
                <th className="py-1">Any</th>
              </tr>
            </thead>
            <tbody className="text-zinc-800">
              {rows.map((r, i) => (
                <tr key={i} className="border-t border-zinc-100">
                  <td className="py-1 pr-3 font-semibold">{r.full_name}</td>
                  <td className="py-1 pr-3">{r.dorsal ?? '—'}</td>
                  <td className="py-1 pr-3">{r.position ?? '—'}</td>
                  <td className="py-1">{r.birth_year ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <div className="mt-3 flex justify-end gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700"
        >
          Cancel·lar
        </button>
        <button
          type="button"
          onClick={save}
          disabled={saving || rows.length === 0}
          className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {saving ? 'Desant…' : `Donar d'alta ${rows.length} jugador${rows.length === 1 ? '' : 's'}`}
        </button>
      </div>
    </div>
  )
}
