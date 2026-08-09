'use client'

import { useState } from 'react'
import { sendAnnouncement } from '../actions'
import { SPORTS } from '@/lib/sports'
import type { Role } from '@/lib/access'

export function NewAnnouncementForm({
  role,
  sectionLabel,
  teams,
}: {
  role: Role
  sectionLabel?: string
  teams?: { id: string; name: string }[]
}) {
  const [open, setOpen] = useState(false)

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white">
        + Nou comunicat
      </button>
    )
  }

  return (
    <form
      action={async (formData) => {
        await sendAnnouncement(formData)
        setOpen(false)
      }}
      className="w-full rounded-2xl border border-zinc-200 bg-white p-4"
    >
      {role === 'admin' && (
        <label className="mb-3 block text-xs font-semibold uppercase text-zinc-500">
          Destinataris
          <select
            name="target"
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm font-normal normal-case text-zinc-900"
          >
            <option value="club">Tot el club</option>
            <option value="families">Totes les famílies</option>
            {SPORTS.map((s) => (
              <option key={s.id} value={`section:${s.id}`}>
                Secció {s.name}
              </option>
            ))}
          </select>
        </label>
      )}

      {role === 'coordinador' && sectionLabel && (
        <p className="mb-3 text-xs text-zinc-500">
          Destinataris: secció <span className="font-semibold text-zinc-700">{sectionLabel}</span>
        </p>
      )}

      {role === 'entrenador' && teams && teams.length > 1 && (
        <label className="mb-3 block text-xs font-semibold uppercase text-zinc-500">
          Equip
          <select
            name="team_id"
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm font-normal normal-case text-zinc-900"
          >
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
      )}
      {role === 'entrenador' && teams && teams.length === 1 && (
        <>
          <input type="hidden" name="team_id" value={teams[0].id} />
          <p className="mb-3 text-xs text-zinc-500">
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
