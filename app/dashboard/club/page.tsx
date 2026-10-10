import { getSession } from '@/lib/membership'
import { accessFor } from '@/lib/access'
import { createClient } from '@/lib/supabase/server'
import { BrandingForm } from './_components/branding-form'

export default async function ClubSettingsPage() {
  const { active } = await getSession()
  if (!active) return null

  if (accessFor('club', active.role) === null) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Configuració</h1>
        <p className="mt-4 text-sm text-zinc-600">No tens accés a aquest mòdul.</p>
      </div>
    )
  }

  // Aquí es llegeix el color tal com està desat (encara que no passi la
  // validació), perquè la direcció el vegi i el pugui corregir.
  const supabase = await createClient()
  const { data: club } = await supabase
    .from('clubs')
    .select('logo_url, primary_color')
    .eq('id', active.clubId)
    .maybeSingle()

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900">Configuració del club</h1>
      <p className="mt-1 text-sm text-zinc-600">
        El logo i el color del club es veuen a tot el tauler (per a tots els rols) i als correus que envia Planter.
      </p>
      <BrandingForm
        clubId={active.clubId}
        clubName={active.clubName}
        initialLogoUrl={club?.logo_url ?? null}
        initialColor={club?.primary_color ?? null}
      />
    </div>
  )
}
