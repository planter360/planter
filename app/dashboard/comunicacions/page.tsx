import { getSession } from '@/lib/membership'
import { ModulePlaceholder } from '../_components/module-placeholder'

export default async function ComunicacionsPage() {
  const { active } = await getSession()
  if (!active) return null
  return <ModulePlaceholder moduleId="comunicacions" role={active.role} title="Comunicacions" />
}
