import Link from 'next/link'
import { getSession } from '@/lib/membership'
import { createClient } from '@/lib/supabase/server'
import { oneOf } from '@/lib/relations'
import { sportName } from '@/lib/sports'
import { PlayersDirectory, type DirectoryPlayer } from './_components/players-directory'

type TeamJoin = { id: string; name: string; sport: string }

export default async function JugadorsPage() {
  const { active } = await getSession()
  if (!active) return null

  const supabase = await createClient()

  // La RLS de players ja retorna només els jugadors que cada rol pot
  // veure (equip propi, secció, tot el club o els fills).
  const { data } = await supabase
    .from('players')
    .select('id, full_name, dorsal, position, birth_year, teams(id, name, sport)')
    .eq('club_id', active.clubId)
    .order('full_name')

  const players: DirectoryPlayer[] = (data ?? []).map((p) => {
    const team = oneOf(p.teams as TeamJoin | TeamJoin[] | null)
    return {
      id: p.id,
      full_name: p.full_name,
      dorsal: p.dorsal,
      position: p.position,
      birth_year: p.birth_year,
      team_id: team?.id ?? null,
      team_label: team ? `${team.name} · ${sportName(team.sport)}` : 'Sense equip',
    }
  })

  return (
    <div>
      <Link href="/dashboard" className="text-xs font-semibold text-zinc-500 hover:underline">
        ← Visió 360
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-zinc-900">Jugadors</h1>
      <p className="mt-1 text-sm text-zinc-600">
        {players.length} jugador{players.length === 1 ? '' : 's'}. Clica&apos;n un per obrir la seva fitxa.
      </p>
      <PlayersDirectory players={players} />
    </div>
  )
}
