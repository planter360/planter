export type ParsedScope =
  | { kind: 'club' }
  | { kind: 'families' }
  | { kind: 'section'; value: string }
  | { kind: 'team'; value: string }
  | { kind: 'teams'; value: string[] }

export function parseScope(scope: string): ParsedScope {
  if (scope === 'families') return { kind: 'families' }
  if (scope.startsWith('section:')) return { kind: 'section', value: scope.slice('section:'.length) }
  // 'teams:' (plural) és el format nou, que admet un o més equips alhora.
  // 'team:' (singular) es manté només per llegir comunicats antics ja
  // enviats abans d'aquest canvi.
  if (scope.startsWith('teams:')) {
    return { kind: 'teams', value: scope.slice('teams:'.length).split(',').filter(Boolean) }
  }
  if (scope.startsWith('team:')) return { kind: 'team', value: scope.slice('team:'.length) }
  return { kind: 'club' }
}
