'use client'

import { useState } from 'react'
import { sendAnnouncement } from '../actions'
import { SPORTS, sportName } from '@/lib/sports'
import type { Role } from '@/lib/access'

type TeamOpt = { id: string; name: string; sport?: string }

export function NewAnnouncementForm({
  role,
  sectionLabel,
  teams,
  sectionTeams,
  allTeams,
}: {
  role: Role
  sectionLabel?: string
  teams?: TeamOpt[]
  sectionTeams?: TeamOpt[]
  allTeams?: TeamOpt[]
}) {
  const [open, setOpen] = useState(false)
  const [adminMode, setAdminMode] = useState<'club' | 'families' | 'section' | 'teams'>('club')
  const [coordMode, setCoordMode] = useState<'section' | 'teams'>('section')
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([])

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white">
        + Nou comunicat
      </button>
    )
  }

  const toggleTeam = (id: string) => {
    setSelectedTeamIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const teamPill = (t: TeamOpt, color: string) => (
    <button
      key={t.id}
      type="button"
      onClick={() => toggleTeam(t.id)}
      className={
        'rounded-full px-3 py-1 text-xs font-semibold ' +
        (selectedTeamIds.includes(t.id) ? color : 'bg-zinc-100 text-zinc-600')
      }
    >
      {t.name}
      {t.sport ? ` · ${sportName(t.sport)}` : ''}
    </button>
  )

  return (
    <form
      action={async (formData) => {
        for (const id of selectedTeamIds) formData.append('team_ids', id)
        await sendAnnouncement(formData)
        setOpen(false)
      }}
      className="w-full rounded-2xl border border-zinc-200 bg-white p-4"
    >
      {role === 'admin' && (
        <div className="mb-4 space-y-2">
          <p className="text-xs font-semibold uppercase text-zinc-500">Destinataris</p>
          <input type="hidden" name="target" value={adminMode} />
          <label className="flex items-center gap-2 text-sm text-zinc-700">
            <input type="radio" checked={adminMode === 'club'} onChange={() => setAdminMode('club')} />
            Tot el club
          </label>
          <label className="flex items-center gap-2 text-sm text-zinc-700">
            <input type="radio" checked={adminMode === 'families'} onChange={() => setAdminMode('families')} />
            Totes les famílies
          </label>
          <label className="flex items-center gap-2 text-sm text-zinc-700">
            <input type="radio" checked={adminMode === 'section'} onChange={() => setAdminMode('section')} />
            Una secció
          </label>
          {adminMode === 'section' && (
            <select
              name="target_section"
              className="ml-6 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-normal normal-case text-zinc-900"
            >
              {SPORTS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          )}
          <label className="flex items-center gap-2 text-sm text-zinc-700">
            <input type="radio" checked={adminMode === 'teams'} onChange={() => setAdminMode('teams')} />
            Equips concrets
          </label>
          {adminMode === 'teams' && (
            <div className="ml-6 flex flex-wrap gap-2">
              {(allTeams ?? []).length === 0 && <p className="text-xs text-zinc-500">Encara no hi ha equips creats.</p>}
              {(allTeams ?? []).map((t) => teamPill(t, 'bg-zinc-900 text-white'))}
            </div>
          )}
        </div>
      )}

      {role === 'coordinador' && sectionLabel && (
        <div className="mb-4 space-y-2">
          <p className="text-xs font-semibold uppercase text-zinc-500">Destinataris</p>
          <input type="hidden" name="target" value={coordMode} />
          <label className="flex items-center gap-2 text-sm text-zinc-700">
            <input type="radio" checked={coordMode === 'section'} onChange={() => setCoordMode('section')} />
            Tota la secció {sectionLabel}
          </label>
          <label className="flex items-center gap-2 text-sm text-zinc-700">
            <input type="radio" checked={coordMode === 'teams'} onChange={() => setCoordMode('teams')} />
            Equips concrets
          </label>
          {coordMode === 'teams' && (
            <div className="ml-6 flex flex-wrap gap-2">
              {(sectionTeams ?? []).length === 0 && (
                <p className="text-xs text-zinc-500">Encara no hi ha equips en aquesta secció.</p>
              )}
              {(sectionTeams ?? []).map((t) => teamPill(t, 'bg-zinc-900 text-white'))}
            </div>
          )}
        </div>
      )}

      {role === 'entrenador' && teams && teams.length > 1 && (
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase text-zinc-500">Equips (selecciona un o més)</p>
          <div className="mt-2 flex flex-wrap gap-2">{teams.map((t) => teamPill(t, 'bg-emerald-600 text-white'))}</div>
        </div>
      )}
      {role === 'entrenador' && teams && teams.length === 1 && (
        <>
          <input type="hidden" name="team_ids" value={teams[0].id} />
          <p className="mb-4 text-xs text-zinc-500">
            Destinataris: <span className="font-semibold text-zinc-700">{teams[0].name}</span>
          </p>
        </>
      )}

      <label className="mb-3 block text-xs font-semibold uppercase text-zinc-500">
        Assumpte
        <input
          name="title"
          required
          placeholder="Assumpte del comunicat"
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm font-normal normal-case text-zinc-900"
        />
      </label>
      <label className="mb-3 block text-xs font-semibold uppercase text-zinc-500">
        Missatge
        <textarea
          name="body"
          rows={3}
          placeholder="Escriu el missatge..."
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm font-normal normal-case text-zinc-900"
        />
      </label>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700"
        >
          Cancel·lar
        </button>
        <button type="submit" className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">
          Enviar
        </button>
      </div>
    </form>
  )
}
