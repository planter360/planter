import { createClient } from '@/lib/supabase/server'
import { TeamPotencial } from './team-potencial'

export async function AdminView({ clubId }: { clubId: string }) {
  const supabase = await createClient()
  const { data: teams } = await supabase.from('teams').select('id, name, sport').eq('club_id', clubId).order('name')

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900">Potencial</h1>
      <p className="mt-1 text-sm text-zinc-600">Valoracions i històrics de potencial de tot el club (lectura).</p>
      <div className="mt-6 space-y-10">
        {(teams ?? []).length === 0 && <p className="text-sm text-zinc-600">Encara no hi ha equips.</p>}
        {(teams ?? []).map((team) => (
          <TeamPotencial key={team.id} team={team} canWrite={false} />
        ))}
      </div>
    </div>
  )
}
