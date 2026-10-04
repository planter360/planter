import { DAYS, timeRangesOverlap } from '@/lib/schedule'

export interface OccupancyTraining {
  id: string
  team_name: string
  days: string[]
  time_txt: string
  place: string
  rainActive?: boolean
}

export function OccupancyGrid({ trainings }: { trainings: OccupancyTraining[] }) {
  const places = [...new Set(trainings.map((t) => t.place))]

  if (places.length === 0) {
    return <p className="text-sm text-zinc-600">Encara no hi ha cap horari definit.</p>
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white">
      <table className="w-full text-xs" style={{ minWidth: 760, borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th className="px-4 py-3 text-left uppercase text-zinc-500">Instal·lació</th>
            {DAYS.map(([code, label]) => (
              <th key={code} className="px-2 py-3 text-left uppercase text-zinc-500">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {places.map((place) => (
            <tr key={place} className="border-t border-zinc-100">
              <td className="whitespace-nowrap px-4 py-3 align-top font-semibold text-zinc-900">{place}</td>
              {DAYS.map(([code]) => {
                const items = trainings.filter((t) => t.place === place && t.days.includes(code))
                const conflict = items.some((a, i) =>
                  items.some((b, j) => i < j && timeRangesOverlap(a.time_txt, b.time_txt))
                )
                return (
                  <td key={code} className={'min-w-28 px-2 py-2 align-top ' + (conflict ? 'bg-red-50' : '')}>
                    {items.map((it) => (
                      <div
                        key={it.id}
                        className={'mb-1 rounded-lg px-2 py-1 ' + (conflict ? 'bg-red-100' : 'bg-zinc-100')}
                      >
                        <div className="font-semibold" style={{ fontSize: 11 }}>
                          {it.team_name}
                          {it.rainActive && <span className="ml-1 text-blue-700">(pluja)</span>}
                        </div>
                        <div className="text-zinc-500" style={{ fontSize: 10 }}>
                          {it.time_txt}
                        </div>
                      </div>
                    ))}
                    {conflict && <span className="text-[10px] font-bold text-red-700">Solapament</span>}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
