import { getSession } from '@/lib/membership'
import { AdminPartitsView } from './_components/admin-view'
import { CoordinadorPartitsView } from './_components/coordinador-view'
import { EntrenadorPartitsView } from './_components/entrenador-view'
import { FamiliaPartitsView } from './_components/familia-view'

export default async function PartitsPage() {
  const { user, active } = await getSession()
  if (!active) return null

  if (active.role === 'admin') return <AdminPartitsView clubId={active.clubId} />
  if (active.role === 'coordinador') return <CoordinadorPartitsView clubId={active.clubId} section={active.section} />
  if (active.role === 'entrenador') return <EntrenadorPartitsView clubId={active.clubId} userId={user.id} />
  return <FamiliaPartitsView clubId={active.clubId} />
}
