import { getSession } from '@/lib/membership'
import { AdminPagamentsView } from './_components/admin-view'
import { CoordinadorPagamentsView } from './_components/coordinador-view'
import { EntrenadorPagamentsView } from './_components/entrenador-view'
import { FamiliaPagamentsView } from './_components/familia-view'
import { parseStatusFilter } from './_components/status-filter'

export default async function PagamentsPage({ searchParams }: { searchParams: Promise<{ estat?: string }> }) {
  const { user, active } = await getSession()
  if (!active) return null

  const estat = parseStatusFilter((await searchParams).estat)

  if (active.role === 'admin') return <AdminPagamentsView clubId={active.clubId} estat={estat} />
  if (active.role === 'coordinador')
    return <CoordinadorPagamentsView clubId={active.clubId} section={active.section} estat={estat} />
  if (active.role === 'entrenador') return <EntrenadorPagamentsView userId={user.id} />
  return <FamiliaPagamentsView clubId={active.clubId} />
}
