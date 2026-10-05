'use client'

import { deleteInstallation } from '../actions'

export function DeleteInstallationButton({ id }: { id: string }) {
  return (
    <button
      onClick={() => {
        if (confirm('Esborrar aquesta instal·lació?')) deleteInstallation(id)
      }}
      className="shrink-0 text-xs font-semibold text-red-600 hover:underline"
    >
      Esborrar
    </button>
  )
}
