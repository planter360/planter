'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ACTIVE_MEMBERSHIP_COOKIE } from '@/lib/membership'

export async function setActiveMembership(membershipId: string) {
  const cookieStore = await cookies()
  cookieStore.set(ACTIVE_MEMBERSHIP_COOKIE, membershipId, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
  })
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  const cookieStore = await cookies()
  cookieStore.delete(ACTIVE_MEMBERSHIP_COOKIE)
  redirect('/login')
}
