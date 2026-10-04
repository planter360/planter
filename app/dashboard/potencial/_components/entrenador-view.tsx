import { createClient } from '@/lib/supabase/server'
import { TeamPotencial } from './team-potencial'

export async function EntrenadorView({ clubId, userId }: { clubId: string; userId: string }) {
  const supabase = await createClient()

  const { data: staffRows } = await supabase.from('team_staff').select('team_id').eq('user_id', userId)
  const teamIds = (staffRows ?? []).map((r) => r.team_id)

  if (teamIds.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Potencial</h1>
        <p className="mt-4 text-sm text-zinc-600">Encara no tens cap equip assignat.</p>
      </div>
    )
  }

  const { data: teams } = await supabase
    .from('teams')
    .select('id, name, sport')
    .in('id', teamIds)
    .eq('club_id', clubId)
    .order('name')

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900">Potencial</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Valores trimestralment els teus jugadors; cada valoració s&apos;afegeix a l&apos;històric.
      </p>
      <div className="mt-6 space-y-10">
        {(teams ?? []).map((team) => (
          <TeamPotencial key={team.id} team={team} canWrite />
        ))}
      </div>
    </div>
  )
}
