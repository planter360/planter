import { getSession } from '@/lib/membership'
import { ModulePlaceholder } from '../_components/module-placeholder'

export default async function ScoutingPage() {
  const { active } = await getSession()
  if (!active) return null
  return <ModulePlaceholder moduleId="scouting" role={active.role} title="Scouting" />
}
