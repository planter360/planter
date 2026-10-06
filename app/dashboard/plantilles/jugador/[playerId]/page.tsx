import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getSession } from '@/lib/membership'
import { createClient } from '@/lib/supabase/server'
import { oneOf } from '@/lib/relations'
import { sportName } from '@/lib/sports'
import { formatDateTime } from '@/lib/format'
import { ChangeTeamForm } from './_components/change-team-form'

type TeamJoin = { id: string; name: string; sport: string }
type MatchJoin = { id: string; rival: string; starts_at: string | null; result: string | null }

function formatDate(date: string): string {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString('ca-ES')
}

function pct(curr: number, prev: number | undefined): number | null {
  if (prev === undefined || prev === 0) return null
  return ((curr - prev) / prev) * 100
}

export default async function PlayerProfilePage({ params }: { params: Promise<{ playerId: string }> }) {
  const { playerId } = await params
  const { active } = await getSession()
  if (!active) return null

  const supabase = await createClient()

  const { data: player } = await supabase
    .from('players')
    .select('id, full_name, dorsal, position, birth_year, team_id, teams(id, name, sport)')
    .eq('id', playerId)
    .eq('club_id', active.clubId)
    .maybeSingle()

  if (!player) notFound()

  const team = oneOf(player.teams as TeamJoin | TeamJoin[] | null)
  const isFamily = active.role === 'familia'

  const { data: secondaryLinks } = await supabase.from('player_teams').select('teams(id, name, sport)').eq('player_id', playerId)
  const secondaryTeams = (secondaryLinks ?? [])
    .map((l) => oneOf(l.teams as TeamJoin | TeamJoin[] | null))
    .filter((t): t is TeamJoin => Boolean(t))

  const { data: history } = await supabase
    .from('player_team_history')
    .select('id, team_id, team_name, kind, started_at, ended_at')
    .eq('player_id', playerId)
    .order('started_at', { ascending: false })

  const { data: attendance } = await supabase.from('attendance').select('present').eq('player_id', playerId)
  const sessionsTotal = attendance?.length ?? 0
  const sessionsPresent = (attendance ?? []).filter((a) => a.present !== false).length

  const { data: callupRows } = await supabase
    .from('callups')
    .select('confirmed, matches(id, rival, starts_at, result)')
    .eq('player_id', playerId)
  const callups = (callupRows ?? [])
    .map((c) => ({ confirmed: c.confirmed, match: oneOf(c.matches as MatchJoin | MatchJoin[] | null) }))
    .filter((c): c is { confirmed: boolean | null; match: MatchJoin } => Boolean(c.match))
    .sort((a, b) => (b.match.starts_at ?? '').localeCompare(a.match.starts_at ?? ''))

  // Família: només mitjana i evolució (via RPC, sense notes ni
  // desglossament). Cos tècnic: l'última valoració sencera.
  let potencial: { avg: number; change: number | null; date: string; detail?: { tec: number; fis: number; tac: number; men: number } } | null =
    null
  if (isFamily) {
    const { data: summary } = await supabase.rpc('guardian_assessment_summary', { p_player_id: playerId })
    const rows = (summary ?? []) as { created_at: string; avg_score: number }[]
    const last = rows[rows.length - 1]
    if (last) {
      potencial = {
        avg: Number(last.avg_score),
        change: pct(Number(last.avg_score), rows.length > 1 ? Number(rows[rows.length - 2].avg_score) : undefined),
        date: last.created_at,
      }
    }
  } else {
    const { data: assessments } = await supabase
      .from('assessments')
      .select('tec, fis, tac, men, created_at')
      .eq('player_id', playerId)
      .order('created_at', { ascending: false })
      .limit(2)
    const [last, prev] = assessments ?? []
    if (last) {
      const avg = (a: { tec: number; fis: number; tac: number; men: number }) => (a.tec + a.fis + a.tac + a.men) / 4
      potencial = {
        avg: avg(last),
        change: pct(avg(last), prev ? avg(prev) : undefined),
        date: last.created_at,
        detail: { tec: last.tec, fis: last.fis, tac: last.tac, men: last.men },
      }
    }
  }

  const canChangeTeam = active.role === 'coordinador' || active.role === 'admin'
  let teamOptions: { id: string; name: string }[] = []
  if (canChangeTeam) {
    let query = supabase.from('teams').select('id, name').eq('club_id', active.clubId).order('name')
    if (active.role === 'coordinador') query = query.eq('sport', active.section ?? '')
    const { data } = await query
    teamOptions = (data ?? []).filter((t) => t.id !== player.team_id)
  }

  const backHref = !isFamily && team ? `/dashboard/plantilles/${team.id}` : '/dashboard/plantilles'

  return (
    <div>
      <Link href={backHref} className="text-xs font-semibold text-zinc-500 hover:underline">
        ← {!isFamily && team ? team.name : 'Plantilles'}
      </Link>

      <div className="mt-3 flex flex-wrap items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-900 text-xl font-bold text-white">
          {player.dorsal ?? '–'}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">{player.full_name}</h1>
          <p className="text-sm text-zinc-600">
            {player.position ?? 'Sense posició'}
            {player.birth_year ? ` · ${player.birth_year}` : ''}
            {team ? ` · ${sportName(team.sport)}` : ''}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Card title="Assistència">
          {sessionsTotal === 0 ? (
            <p className="text-sm text-zinc-500">Encara no hi ha sessions registrades.</p>
          ) : (
            <>
              <div className="text-3xl font-bold text-zinc-900">{Math.round((sessionsPresent / sessionsTotal) * 100)}%</div>
              <p className="text-xs text-zinc-500">
                {sessionsPresent} de {sessionsTotal} sessions
              </p>
            </>
          )}
        </Card>

        <Card title="Partits">
          <div className="text-3xl font-bold text-zinc-900">{callups.length}</div>
          <p className="text-xs text-zinc-500">convocatòries</p>
        </Card>

        <Card title="Potencial" href={isFamily ? undefined : '/dashboard/potencial'}>
          {!potencial ? (
            <p className="text-sm text-zinc-500">Encara no hi ha cap valoració.</p>
          ) : (
            <>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-emerald-700">{potencial.avg.toFixed(1)}</span>
                <span className="text-sm text-zinc-500">/ 5</span>
                {potencial.change !== null && (
                  <span
                    className={
                      'text-sm font-semibold ' +
                      (potencial.change > 0 ? 'text-emerald-700' : potencial.change < 0 ? 'text-red-600' : 'text-zinc-500')
                    }
                  >
                    {potencial.change > 0 ? '+' : ''}
                    {potencial.change.toFixed(0)}%
                  </span>
                )}
              </div>
              {potencial.detail && (
                <p className="mt-1 text-xs font-semibold text-zinc-600">
                  T {potencial.detail.tec} · F {potencial.detail.fis} · Tà {potencial.detail.tac} · M {potencial.detail.men}
                </p>
              )}
              <p className="text-xs text-zinc-400">Última: {new Date(potencial.date).toLocaleDateString('ca-ES')}</p>
            </>
          )}
        </Card>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Card title="Equips actuals">
          <ul className="space-y-2 text-sm">
            <li className="flex flex-wrap items-center justify-between gap-2">
              <span>
                <span className="font-semibold text-zinc-900">{team?.name ?? 'Sense equip'}</span>
                <span className="ml-2 rounded-full bg-zinc-900 px-2 py-0.5 text-[10px] font-semibold uppercase text-white">
                  Principal
                </span>
              </span>
              {canChangeTeam && <ChangeTeamForm playerId={player.id} teamOptions={teamOptions} />}
            </li>
            {secondaryTeams.map((t) => (
              <li key={t.id}>
                <span className="font-semibold text-zinc-900">{t.name}</span>
                <span className="ml-2 rounded-full bg-zinc-200 px-2 py-0.5 text-[10px] font-semibold uppercase text-zinc-700">
                  Secundari
                </span>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Historial d'equips al club">
          {!history || history.length === 0 ? (
            <p className="text-sm text-zinc-500">Encara no hi ha historial registrat.</p>
          ) : (
            <ol className="space-y-2 text-sm">
              {history.map((h) => (
                <li key={h.id} className="flex flex-wrap items-baseline justify-between gap-2">
                  <span>
                    <span className="font-semibold text-zinc-900">{h.team_name}</span>
                    {h.kind === 'secundari' && <span className="ml-1 text-xs text-zinc-500">(secundari)</span>}
                  </span>
                  <span className="text-xs text-zinc-500">
                    {formatDate(h.started_at)} – {h.ended_at ? formatDate(h.ended_at) : 'actualitat'}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>

      <div className="mt-6">
        <Card title="Últimes convocatòries" href="/dashboard/partits">
          {callups.length === 0 ? (
            <p className="text-sm text-zinc-500">Encara no ha estat convocat/da.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {callups.slice(0, 5).map((c) => (
                <li key={c.match.id} className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-semibold text-zinc-900">vs {c.match.rival}</span>
                  <span className="text-xs text-zinc-500">
                    {c.match.starts_at ? formatDateTime(c.match.starts_at) : 'Data per confirmar'}
                    {c.match.result ? ` · ${c.match.result}` : ''}
                    {c.confirmed === true ? ' · confirmat' : c.confirmed === false ? ' · no disponible' : ''}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}

function Card({ title, href, children }: { title: string; href?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{title}</h2>
        {href && (
          <Link href={href} className="text-xs font-semibold text-emerald-700 hover:underline">
            Veure →
          </Link>
        )}
      </div>
      {children}
    </div>
  )
}
