import { getSession } from '@/lib/membership'
import { ModulePlaceholder } from '../_components/module-placeholder'

export default async function LlicenciesPage() {
  const { active } = await getSession()
  if (!active) return null
  return <ModulePlaceholder moduleId="llicencies" role={active.role} title="Llicències" />
}
