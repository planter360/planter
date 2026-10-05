import { createClient } from '@/lib/supabase/server'

export interface Installation {
  id: string
  name: string
  address: string | null
}

export async function getInstallations(clubId: string): Promise<Installation[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('installations')
    .select('id, name, address')
    .eq('club_id', clubId)
    .order('name')
  return data ?? []
}
