import { getSession } from '@/lib/membership'
import { ModulePlaceholder } from '../_components/module-placeholder'

export default async function PotencialPage() {
  const { active } = await getSession()
  if (!active) return null
  return <ModulePlaceholder moduleId="potencial" role={active.role} title="Potencial" />
}
