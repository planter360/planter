import { getSession } from '@/lib/membership'
import { AdminPagamentsView } from './_components/admin-view'
import { CoordinadorPagamentsView } from './_components/coordinador-view'
import { EntrenadorPagamentsView } from './_components/entrenador-view'
import { FamiliaPagamentsView } from './_components/familia-view'

export default async function PagamentsPage() {
  const { user, active } = await getSession()
  if (!active) return null

  if (active.role === 'admin') return <AdminPagamentsView clubId={active.clubId} />
  if (active.role === 'coordinador') return <CoordinadorPagamentsView clubId={active.clubId} section={active.section} />
  if (active.role === 'entrenador') return <EntrenadorPagamentsView userId={user.id} />
  return <FamiliaPagamentsView clubId={active.clubId} />
}
