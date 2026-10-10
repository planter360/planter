'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'

export interface DirectoryPlayer {
  id: string
  full_name: string
  dorsal: number | null
  position: string | null
  birth_year: number | null
  team_id: string | null
  team_label: string
}

function normalize(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

export function PlayersDirectory({ players }: { players: DirectoryPlayer[] }) {
  const [query, setQuery] = useState('')
  const [teamId, setTeamId] = useState('')

  const teams = useMemo(() => {
    const map = new Map<string, string>()
    for (const p of players) if (p.team_id) map.set(p.team_id, p.team_label)
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]))
  }, [players])

  const filtered = useMemo(() => {
    const q = normalize(query.trim())
    return players.filter(
      (p) => (!teamId || p.team_id === teamId) && (!q || normalize(p.full_name).includes(q))
    )
  }, [players, query, teamId])

  return (
    <div className="mt-5">
      <div className="flex flex-wrap gap-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cerca per nom…"
          className="min-w-0 flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 sm:max-w-xs"
        />
        {teams.length > 1 && (
          <select
            value={teamId}
            onChange={(e) => setTeamId(e.target.value)}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
          >
            <option value="">Tots els equips</option>
            {teams.map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        )}
      </div>

      {filtered.length === 0 && <p className="mt-6 text-sm text-zinc-600">Cap jugador coincideix amb la cerca.</p>}

      <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((p) => (
          <Link
            key={p.id}
            href={`/dashboard/plantilles/jugador/${p.id}`}
            className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-3 py-2.5 hover:border-brand"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-xs font-bold text-white">
              {p.dorsal ?? '–'}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-zinc-900">{p.full_name}</span>
              <span className="block truncate text-xs text-zinc-500">
                {p.team_label}
                {p.position ? ` · ${p.position}` : ''}
                {p.birth_year ? ` · ${p.birth_year}` : ''}
              </span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
