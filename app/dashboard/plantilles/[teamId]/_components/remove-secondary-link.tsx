'use client'

import { removeSecondaryTeam } from '../../actions'

export function RemoveSecondaryLink({ playerId, teamId, playerName }: { playerId: string; teamId: string; playerName: string }) {
  return (
    <button
      onClick={async () => {
        if (confirm(`Treure ${playerName} d'aquest equip secundari?`)) {
          await removeSecondaryTeam(playerId, teamId)
        }
      }}
      className="shrink-0 text-xs font-semibold text-red-600 hover:underline"
    >
      Treure vincle
    </button>
  )
}
