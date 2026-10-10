'use client'

import { useTransition } from 'react'
import { markReceiptStatus } from '../actions'

export function ReceiptActions({
  receiptId,
  status,
  overdue,
}: {
  receiptId: string
  status: string
  overdue: boolean
}) {
  const [pending, startTransition] = useTransition()

  if (status === 'pagat' || status === 'anullat') return null

  return (
    <div className="flex justify-end gap-3">
      <button
        disabled={pending}
        onClick={() => startTransition(() => markReceiptStatus(receiptId, 'pagat'))}
        className="text-xs font-semibold text-brand-strong hover:underline disabled:opacity-60"
      >
        Marcar pagat
      </button>
      {overdue && status !== 'vencut' && (
        <button
          disabled={pending}
          onClick={() => startTransition(() => markReceiptStatus(receiptId, 'vencut'))}
          className="text-xs font-semibold text-red-600 hover:underline disabled:opacity-60"
        >
          Marcar vençut
        </button>
      )}
    </div>
  )
}
