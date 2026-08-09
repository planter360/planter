export type ParsedScope =
  | { kind: 'club' }
  | { kind: 'families' }
  | { kind: 'section'; value: string }
  | { kind: 'team'; value: string }

export function parseScope(scope: string): ParsedScope {
  if (scope === 'families') return { kind: 'families' }
  if (scope.startsWith('section:')) return { kind: 'section', value: scope.slice('section:'.length) }
  if (scope.startsWith('team:')) return { kind: 'team', value: scope.slice('team:'.length) }
  return { kind: 'club' }
}
