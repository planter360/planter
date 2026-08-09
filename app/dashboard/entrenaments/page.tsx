import { getSession } from '@/lib/membership'
import { AdminCoordinadorView } from './_components/admin-coordinador-view'
import { EntrenadorView } from './_components/entrenador-view'
import { FamiliaView } from './_components/familia-view'

export default async function EntrenamentsPage() {
  const { user, active } = await getSession()
  if (!active) return null

  if (active.role === 'admin' || active.role === 'coordinador') {
    return <AdminCoordinadorView clubId={active.clubId} role={active.role} section={active.section} />
  }
  if (active.role === 'entrenador') {
    return <EntrenadorView clubId={active.clubId} userId={user.id} />
  }
  return <FamiliaView clubId={active.clubId} />
}
