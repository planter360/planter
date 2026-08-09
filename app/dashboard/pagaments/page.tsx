import { getSession } from '@/lib/membership'
import { ModulePlaceholder } from '../_components/module-placeholder'

export default async function PagamentsPage() {
  const { active } = await getSession()
  if (!active) return null
  return <ModulePlaceholder moduleId="pagaments" role={active.role} title="Pagaments" />
}
