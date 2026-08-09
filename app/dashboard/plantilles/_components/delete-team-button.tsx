'use client'

import { deleteTeam } from '../actions'

export function DeleteTeamButton({ teamId, teamName }: { teamId: string; teamName: string }) {
  return (
    <button
      onClick={async () => {
        if (confirm(`Eliminar l'equip ${teamName}? Es perdran els seus jugadors i horaris.`)) {
          await deleteTeam(teamId)
        }
      }}
      className="text-xs font-semibold text-red-600 hover:underline"
    >
      Eliminar
    </button>
  )
}
