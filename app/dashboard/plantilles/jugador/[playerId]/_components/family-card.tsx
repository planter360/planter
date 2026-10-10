'use client'

import { useState } from 'react'
import { inviteGuardian, removeGuardian } from '../../../actions'

export interface GuardianRow {
  full_name: string | null
  email: string
  pending: boolean
}

const inputClass = 'rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900'

export function FamilyCard({ playerId, guardians }: { playerId: string; guardians: GuardianRow[] }) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')
  const [warning, setWarning] = useState(false)
  const [error, setError] = useState('')

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Família</h2>
        {!open && (
          <button
            onClick={() => {
              setOpen(true)
              setNotice('')
            }}
            className="text-xs font-semibold text-brand-strong hover:underline"
          >
            + Afegir familiar
          </button>
        )}
      </div>

      {guardians.length === 0 && !open && (
        <p className="text-sm text-zinc-500">
          Cap familiar vinculat. Sense vinculació, la família no veu els rebuts ni el calendari del jugador.
        </p>
      )}

      <ul className="space-y-2 text-sm">
        {guardians.map((g) => (
          <li key={g.email} className="flex flex-wrap items-center justify-between gap-2">
            <span className="min-w-0">
              <span className="font-semibold text-zinc-900">{g.full_name ?? g.email}</span>
              {g.full_name && <span className="block truncate text-xs text-zinc-500">{g.email}</span>}
            </span>
            <span className="flex items-center gap-3">
              {g.pending && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-800">
                  Pendent d&apos;entrar
                </span>
              )}
              <button
                onClick={async () => {
                  if (confirm(`Treure l'accés de ${g.email} a aquest jugador?`)) await removeGuardian(playerId, g.email)
                }}
                className="text-xs font-semibold text-red-600 hover:underline"
              >
                Treure
              </button>
            </span>
          </li>
        ))}
      </ul>

      {open && (
        <form
          action={async (formData) => {
            setSaving(true)
            setError('')
            try {
              const result = await inviteGuardian(playerId, formData)
              setNotice(result.notice ?? '')
              setWarning(Boolean(result.warning))
              setOpen(false)
            } catch (e) {
              setError(e instanceof Error ? e.message : 'No s’ha pogut afegir.')
            } finally {
              setSaving(false)
            }
          }}
          className="mt-3 flex flex-wrap items-end gap-2"
        >
          <input name="full_name" placeholder="Nom (opcional)" className={inputClass + ' w-40'} />
          <input name="email" type="email" required placeholder="correu@exemple.cat" className={inputClass + ' w-56'} />
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-brand-strong px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
          >
            {saving ? 'Afegint…' : 'Afegir'}
          </button>
          <button type="button" onClick={() => setOpen(false)} className="text-xs font-semibold text-zinc-500">
            Cancel·la
          </button>
          {error && <p className="w-full text-sm text-red-600">{error}</p>}
        </form>
      )}

      {notice && (
        <p className={'mt-3 text-xs ' + (warning ? 'rounded-lg bg-amber-50 px-2 py-1 text-amber-800' : 'text-emerald-700')}>
          {notice}
        </p>
      )}
    </div>
  )
}
