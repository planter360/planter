import { getSession } from '@/lib/membership'
import { getInstallations } from '@/lib/installations'
import { AdminPartitsView } from './_components/admin-view'
import { CoordinadorPartitsView } from './_components/coordinador-view'
import { EntrenadorPartitsView } from './_components/entrenador-view'
import { FamiliaPartitsView } from './_components/familia-view'

export default async function PartitsPage() {
  const { user, active } = await getSession()
  if (!active) return null

  const installations = await getInstallations(active.clubId)

  if (active.role === 'admin') return <AdminPartitsView clubId={active.clubId} installations={installations} />
  if (active.role === 'coordinador')
    return <CoordinadorPartitsView clubId={active.clubId} section={active.section} installations={installations} />
  if (active.role === 'entrenador')
    return <EntrenadorPartitsView clubId={active.clubId} userId={user.id} installations={installations} />
  return <FamiliaPartitsView clubId={active.clubId} installations={installations} />
}
