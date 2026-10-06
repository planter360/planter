'use client'

import { useState } from 'react'
import { assignCoach } from '../../actions'
import { CoachPicker, type CoachOption } from '../../_components/coach-picker'

export function AssignCoachForm({ teamId, coaches }: { teamId: string; coaches: CoachOption[] }) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')
  const [warning, setWarning] = useState(false)
  const [error, setError] = useState('')

  if (!open) {
    return (
      <span className="inline-flex flex-wrap items-center gap-2">
        <button
          onClick={() => {
            setOpen(true)
            setNotice('')
          }}
          className="text-xs font-semibold text-emerald-700 hover:underline"
        >
          Assignar entrenador/a
        </button>
        {notice && (
          <span
            className={
              'text-xs ' + (warning ? 'rounded-lg bg-amber-50 px-2 py-1 text-amber-800' : 'text-emerald-700')
            }
          >
            {notice}
          </span>
        )}
      </span>
    )
  }

  return (
    <form
      action={async (formData) => {
        setSaving(true)
        setError('')
        try {
          const result = await assignCoach(teamId, formData)
          setNotice(result.notice ?? '')
          setWarning(Boolean(result.warning))
          setOpen(false)
        } catch (e) {
          setError(e instanceof Error ? e.message : 'No s’ha pogut assignar.')
        } finally {
          setSaving(false)
        }
      }}
      className="mt-3 flex flex-wrap items-end gap-3 rounded-2xl border border-zinc-200 bg-white p-4"
    >
      <CoachPicker coaches={coaches} allowNone={false} />
      {error && <p className="w-full text-sm text-red-600">{error}</p>}
      <div className="ml-auto flex gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700"
        >
          Cancel·lar
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {saving ? 'Desant…' : 'Assignar'}
        </button>
      </div>
    </form>
  )
}
