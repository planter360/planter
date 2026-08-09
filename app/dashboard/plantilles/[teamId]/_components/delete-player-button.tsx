'use client'

import { deletePlayer } from '../../actions'

export function DeletePlayerButton({
  teamId,
  playerId,
  playerName,
}: {
  teamId: string
  playerId: string
  playerName: string
}) {
  return (
    <button
      onClick={async () => {
        if (confirm(`Donar de baixa ${playerName}?`)) {
          await deletePlayer(teamId, playerId)
        }
      }}
      className="shrink-0 text-xs font-semibold text-red-600 hover:underline"
    >
      Baixa
    </button>
  )
}
