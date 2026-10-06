import { getSession } from '@/lib/membership'
import { allowedModules } from '@/lib/access'
import { Sidebar } from './_components/sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, memberships, active } = await getSession()

  if (!active) {
    return (
      <div className="mx-auto max-w-md py-24 text-center">
        <h1 className="text-xl font-semibold text-zinc-900">Encara no tens cap club assignat</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Demana a l&apos;administrador del teu club que et doni d&apos;alta amb el teu correu ({user.email}).
        </p>
      </div>
    )
  }

  const modules = allowedModules(active.role)

  return (
    <div className="flex flex-1 flex-col md:flex-row">
      <Sidebar
        modules={modules}
        clubName={active.clubName}
        role={active.role}
        userEmail={user.email ?? ''}
        memberships={memberships}
        activeMembershipId={active.id}
      />
      <main className="min-w-0 flex-1 overflow-y-auto px-4 py-5 sm:p-6 md:p-10">{children}</main>
    </div>
  )
}
