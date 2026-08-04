import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function Dashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: memberships } = await supabase
    .from('memberships')
    .select('role, section, clubs(name)')
    .eq('user_id', user.id)

  return (
    <div style={{ maxWidth: 480, margin: '4rem auto' }}>
      <h1>Hola, {user.email}</h1>
      <p>Els teus rols:</p>
      <pre>{JSON.stringify(memberships, null, 2)}</pre>
    </div>
  )
}