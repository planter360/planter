'use client'

import { useTransition } from 'react'
import { setTeamGender } from '../../actions'
import { TEAM_GENDERS } from '@/lib/teams'

export function TeamGenderSelect({ teamId, gender }: { teamId: string; gender: string | null }) {
  const [pending, startTransition] = useTransition()

  return (
    <select
      aria-label="Categoria de l'equip"
      value={gender ?? ''}
      disabled={pending}
      onChange={(e) => startTransition(() => setTeamGender(teamId, e.target.value))}
      className="rounded-lg border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-700 disabled:opacity-60"
    >
      <option value="">Sense categoria</option>
      {TEAM_GENDERS.map((g) => (
        <option key={g.id} value={g.id}>
          {g.name}
        </option>
      ))}
    </select>
  )
}
