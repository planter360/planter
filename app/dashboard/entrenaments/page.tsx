import { getSession } from '@/lib/membership'
import { ModulePlaceholder } from '../_components/module-placeholder'

export default async function EntrenamentsPage() {
  const { active } = await getSession()
  if (!active) return null
  return <ModulePlaceholder moduleId="entrenaments" role={active.role} title="Entrenaments" />
}
