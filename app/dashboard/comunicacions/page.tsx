import { getSession } from '@/lib/membership'
import { createClient } from '@/lib/supabase/server'
import { oneOf } from '@/lib/relations'
import { sportName } from '@/lib/sports'
import { parseScope } from '@/lib/announcements'
import { NewAnnouncementForm } from './_components/new-announcement-form'

type AuthorJoin = { full_name: string | null }
type TeamJoin = { id: string; sport: string }

export default async function ComunicacionsPage() {
  const { user, active } = await getSession()
  if (!active) return null

  const supabase = await createClient()

  let myTeams: { id: string; name: string; sport: string }[] = []
  if (active.role === 'entrenador') {
    const { data: staffRows } = await supabase.from('team_staff').select('team_id').eq('user_id', user.id)
    const teamIds = (staffRows ?? []).map((r) => r.team_id)
    if (teamIds.length) {
      const { data } = await supabase.from('teams').select('id, name, sport').in('id', teamIds)
      myTeams = data ?? []
    }
  }

  let kidTeams: TeamJoin[] = []
  if (active.role === 'familia') {
    const { data: kids } = await supabase
      .from('players')
      .select('team_id, teams(id, sport)')
      .eq('club_id', active.clubId)
    kidTeams = (kids ?? [])
      .map((k) => oneOf(k.teams as TeamJoin | TeamJoin[] | null))
      .filter((t): t is TeamJoin => Boolean(t))
  }

  const { data } = await supabase
    .from('announcements')
    .select('id, scope, title, body, created_at, profiles(full_name)')
    .eq('club_id', active.clubId)
    .order('created_at', { ascending: false })

  const teamNameCache = new Map<string, string>()
  for (const t of myTeams) teamNameCache.set(t.id, t.name)

  const unresolvedTeamIds = new Set<string>()
  for (const row of data ?? []) {
    const parsed = parseScope(row.scope)
    if (parsed.kind === 'team' && !teamNameCache.has(parsed.value)) unresolvedTeamIds.add(parsed.value)
  }
  if (unresolvedTeamIds.size > 0) {
    const { data: extraTeams } = await supabase.from('teams').select('id, name').in('id', [...unresolvedTeamIds])
    for (const t of extraTeams ?? []) teamNameCache.set(t.id, t.name)
  }

  const visible = (data ?? []).filter((row) => {
    const parsed = parseScope(row.scope)
    if (parsed.kind === 'club') return true
    if (active.role === 'admin') return true
    if (parsed.kind === 'families') return active.role === 'familia'
    if (parsed.kind === 'section') {
      if (active.role === 'coordinador') return parsed.value === active.section
      if (active.role === 'entrenador') return myTeams.some((t) => t.sport === parsed.value)
      if (active.role === 'familia') return kidTeams.some((t) => t.sport === parsed.value)
      return false
    }
    if (parsed.kind === 'team') {
      if (active.role === 'entrenador') return myTeams.some((t) => t.id === parsed.value)
      if (active.role === 'familia') return kidTeams.some((t) => t.id === parsed.value)
      return false
    }
    return false
  })

  const rows = visible.map((row) => {
    const author = oneOf(row.profiles as AuthorJoin | AuthorJoin[] | null)
    const parsed = parseScope(row.scope)
    let scopeLabel = 'Tot el club'
    if (parsed.kind === 'families') scopeLabel = 'Famílies'
    else if (parsed.kind === 'section') scopeLabel = `Secció ${sportName(parsed.value)}`
    else if (parsed.kind === 'team') scopeLabel = teamNameCache.get(parsed.value) ?? 'Equip'
    return {
      id: row.id,
      title: row.title,
      body: row.body,
      created_at: row.created_at,
      author_name: author?.full_name ?? 'Club',
      scope_label: scopeLabel,
    }
  })

  const canSend = active.role !== 'familia' && (active.role !== 'entrenador' || myTeams.length > 0)

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Comunicacions</h1>
          <p className="mt-1 text-sm text-zinc-600">
            {active.role === 'admin' && 'Envia comunicats a tot el club o per segments.'}
            {active.role === 'coordinador' && `Envia comunicats a la secció ${sportName(active.section ?? '')}.`}
            {active.role === 'entrenador' && 'Envia missatges al teu equip i a les seves famílies.'}
            {active.role === 'familia' && 'Comunicats rebuts del club.'}
          </p>
        </div>
        {canSend && (
          <NewAnnouncementForm
            role={active.role}
            sectionLabel={active.role === 'coordinador' ? sportName(active.section ?? '') : undefined}
            teams={active.role === 'entrenador' ? myTeams : undefined}
          />
        )}
      </div>

      <div className="mt-6 space-y-3">
        {rows.length === 0 && <p className="text-sm text-zinc-600">Encara no hi ha cap comunicat.</p>}
        {rows.map((r) => (
          <div key={r.id} className="rounded-2xl border border-zinc-200 bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-500">
              <span>
                {r.author_name} · {r.scope_label}
              </span>
              <span>{new Date(r.created_at).toLocaleDateString('ca-ES')}</span>
            </div>
            <div className="mt-1 font-semibold text-zinc-900">{r.title}</div>
            {r.body && <p className="mt-1 text-sm text-zinc-600">{r.body}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}
