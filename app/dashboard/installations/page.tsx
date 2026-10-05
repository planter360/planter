import { getSession } from '@/lib/membership'
import { accessFor } from '@/lib/access'
import { getInstallations } from '@/lib/installations'
import { mapsSearchUrl } from '@/lib/maps'
import { NewInstallationForm } from './_components/new-installation-form'
import { DeleteInstallationButton } from './_components/delete-installation-button'

export default async function InstallationsPage() {
  const { active } = await getSession()
  if (!active) return null

  if (accessFor('installations', active.role) === null) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Instal·lacions</h1>
        <p className="mt-4 text-sm text-zinc-600">No tens accés a aquest mòdul.</p>
      </div>
    )
  }

  const installations = await getInstallations(active.clubId)

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Instal·lacions</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Llistat compartit d&apos;instal·lacions del club: apareix com a desplegable a Entrenaments i Partits.
          </p>
        </div>
        <NewInstallationForm />
      </div>

      <div className="mt-6 space-y-2">
        {installations.length === 0 && (
          <p className="text-sm text-zinc-600">Encara no hi ha cap instal·lació donada d&apos;alta.</p>
        )}
        {installations.map((i) => (
          <div
            key={i.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white p-4"
          >
            <div>
              <div className="font-semibold text-zinc-900">{i.name}</div>
              {i.address && (
                <a
                  href={mapsSearchUrl(i.address)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-emerald-700 underline underline-offset-2"
                >
                  {i.address}
                </a>
              )}
            </div>
            <DeleteInstallationButton id={i.id} />
          </div>
        ))}
      </div>
    </div>
  )
}
