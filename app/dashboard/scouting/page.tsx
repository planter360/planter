import Link from 'next/link'
import { getSession } from '@/lib/membership'
import { accessFor } from '@/lib/access'
import { ScoutingPlayersView } from './_components/scouting-players-view'
import { MatchPlansView } from './_components/match-plans-view'

export default async function ScoutingPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { user, active } = await getSession()
  if (!active) return null

  if (accessFor('scouting', active.role) === null) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Scouting</h1>
        <p className="mt-4 text-sm text-zinc-600">No tens accés a aquest mòdul.</p>
      </div>
    )
  }

  const { tab } = await searchParams
  const activeTab = tab === 'plans' ? 'plans' : 'jugadors'

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Scouting</h1>
          <p className="mt-1 text-sm text-zinc-600">Seguiment de jugadors i plans de partit contra els rivals.</p>
        </div>
        <div className="flex gap-1 rounded-xl border border-zinc-200 bg-white p-1">
          <Link
            href="/dashboard/scouting?tab=jugadors"
            className={
              'rounded-lg px-3 py-1.5 text-sm font-semibold ' +
              (activeTab === 'jugadors' ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100')
            }
          >
            Jugadors vigilats
          </Link>
          <Link
            href="/dashboard/scouting?tab=plans"
            className={
              'rounded-lg px-3 py-1.5 text-sm font-semibold ' +
              (activeTab === 'plans' ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100')
            }
          >
            Plans de partit
          </Link>
        </div>
      </div>

      <div className="mt-6">
        {activeTab === 'jugadors' ? (
          <ScoutingPlayersView clubId={active.clubId} role={active.role} section={active.section} userId={user.id} />
        ) : (
          <MatchPlansView clubId={active.clubId} />
        )}
      </div>
    </div>
  )
}
