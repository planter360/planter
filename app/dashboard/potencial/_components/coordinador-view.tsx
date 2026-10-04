import { createClient } from '@/lib/supabase/server'
import { sportName } from '@/lib/sports'
import { TeamPotencial } from './team-potencial'

export async function CoordinadorView({ clubId, section }: { clubId: string; section: string | null }) {
  const supabase = await createClient()
  const { data: teams } = await supabase
    .from('teams')
    .select('id, name, sport')
    .eq('club_id', clubId)
    .eq('sport', section ?? '')
    .order('name')

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900">Potencial</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Valores el potencial de la secció {sportName(section ?? '')} i en consultes l&apos;evolució històrica.
      </p>
      <div className="mt-6 space-y-10">
        {(teams ?? []).length === 0 && <p className="text-sm text-zinc-600">Encara no hi ha equips en aquesta secció.</p>}
        {(teams ?? []).map((team) => (
          <TeamPotencial key={team.id} team={team} canWrite />
        ))}
      </div>
    </div>
  )
}
