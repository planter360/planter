import { getSession } from '@/lib/membership'
import { AdminView } from './_components/admin-view'
import { CoordinadorView } from './_components/coordinador-view'
import { EntrenadorView } from './_components/entrenador-view'
import { FamiliaView } from './_components/familia-view'

export default async function PotencialPage() {
  const { user, active } = await getSession()
  if (!active) return null

  if (active.role === 'admin') return <AdminView clubId={active.clubId} />
  if (active.role === 'coordinador') return <CoordinadorView clubId={active.clubId} section={active.section} />
  if (active.role === 'entrenador') return <EntrenadorView clubId={active.clubId} userId={user.id} />
  return <FamiliaView clubId={active.clubId} />
}
