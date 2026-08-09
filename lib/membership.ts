import { cache } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { oneOf } from '@/lib/relations'
import type { Role } from '@/lib/access'

export const ACTIVE_MEMBERSHIP_COOKIE = 'planter_membership'

export interface Membership {
  id: string
  clubId: string
  clubName: string
  role: Role
  section: string | null
}

// Memoized per request: layout and pages can all call this without
// re-querying Supabase (React.cache dedupes within one render pass).
export const getSession = cache(async () => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data } = await supabase
    .from('memberships')
    .select('id, club_id, role, section, clubs(name)')
    .eq('user_id', user.id)
    .order('created_at')

  const memberships: Membership[] = (data ?? []).map((m) => ({
    id: m.id as string,
    clubId: m.club_id as string,
    clubName: oneOf(m.clubs as { name: string } | { name: string }[] | null)?.name ?? '',
    role: m.role as Role,
    section: m.section as string | null,
  }))

  const cookieStore = await cookies()
  const preferredId = cookieStore.get(ACTIVE_MEMBERSHIP_COOKIE)?.value
  const active = memberships.find((m) => m.id === preferredId) ?? memberships[0] ?? null

  return { user, memberships, active }
})
