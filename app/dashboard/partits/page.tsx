import { getSession } from '@/lib/membership'
import { ModulePlaceholder } from '../_components/module-placeholder'

export default async function PartitsPage() {
  const { active } = await getSession()
  if (!active) return null
  return <ModulePlaceholder moduleId="partits" role={active.role} title="Partits" />
}
