export type Role = 'admin' | 'coordinador' | 'entrenador' | 'familia'

export const ROLES: Role[] = ['admin', 'coordinador', 'entrenador', 'familia']

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Direcció / Junta',
  coordinador: 'Coordinador',
  entrenador: 'Entrenador',
  familia: 'Família',
}

export type AccessLevel = 'full' | 'read' | 'partial' | null

export type ModuleId =
  | 'dashboard'
  | 'pagaments'
  | 'plantilles'
  | 'entrenaments'
  | 'partits'
  | 'scouting'
  | 'potencial'
  | 'comunicacions'
  | 'llicencies'
  | 'installations'
  | 'club'

export interface ModuleDef {
  id: ModuleId
  label: string
  href: string
}

export const MODULES: ModuleDef[] = [
  { id: 'dashboard', label: 'Visió 360', href: '/dashboard' },
  { id: 'pagaments', label: 'Pagaments', href: '/dashboard/pagaments' },
  { id: 'plantilles', label: 'Plantilles', href: '/dashboard/plantilles' },
  { id: 'entrenaments', label: 'Entrenaments', href: '/dashboard/entrenaments' },
  { id: 'partits', label: 'Partits', href: '/dashboard/partits' },
  { id: 'scouting', label: 'Scouting', href: '/dashboard/scouting' },
  { id: 'potencial', label: 'Potencial', href: '/dashboard/potencial' },
  { id: 'comunicacions', label: 'Comunicacions', href: '/dashboard/comunicacions' },
  { id: 'installations', label: 'Instal·lacions', href: '/dashboard/installations' },
  { id: 'llicencies', label: 'Llicències', href: '/dashboard/llicencies' },
  { id: 'club', label: 'Configuració', href: '/dashboard/club' },
]

// Matriu de visibilitat — especificacio-crm-clubs-esportius.md §2.1
export const ACCESS: Record<ModuleId, Record<Role, AccessLevel>> = {
  dashboard: { admin: 'full', coordinador: 'full', entrenador: 'full', familia: 'full' },
  pagaments: { admin: 'full', coordinador: 'read', entrenador: 'partial', familia: 'partial' },
  plantilles: { admin: 'read', coordinador: 'full', entrenador: 'full', familia: 'partial' },
  entrenaments: { admin: 'read', coordinador: 'read', entrenador: 'full', familia: 'partial' },
  partits: { admin: 'read', coordinador: 'full', entrenador: 'full', familia: 'partial' },
  scouting: { admin: 'full', coordinador: 'full', entrenador: 'full', familia: null },
  potencial: { admin: 'read', coordinador: 'full', entrenador: 'full', familia: 'partial' },
  comunicacions: { admin: 'full', coordinador: 'full', entrenador: 'full', familia: 'partial' },
  installations: { admin: 'full', coordinador: 'full', entrenador: null, familia: null },
  llicencies: { admin: 'read', coordinador: null, entrenador: null, familia: null },
  club: { admin: 'full', coordinador: null, entrenador: null, familia: null },
}

export const VIS_NOTE: Partial<Record<ModuleId, Partial<Record<Role, string>>>> = {
  pagaments: {
    admin: 'Veus tots els rebuts, pots crear-ne de nous, enviar recordatoris i generar remeses.',
    coordinador: "Veus l'estat de cobrament per equip de la teva secció, sense dades bancàries.",
    entrenador: 'Veus només si els teus jugadors estan al dia (sense imports ni dades de la família).',
    familia: 'Veus i pagues només els rebuts dels teus fills.',
  },
  entrenaments: {
    admin: "Horaris de tots els equips i graella d'ocupació d'instal·lacions.",
    coordinador: 'Horaris de la teva secció i graella d’ocupació de totes les instal·lacions del club.',
    entrenador: "Crees sessions d'entrenament i hi passes llista d'assistència.",
    familia: 'Veus horaris i sessions dels teus fills i pots notificar absències.',
  },
  partits: {
    admin: 'Resultats i calendari de tots els equips (lectura).',
    coordinador: 'Calendari de la teva secció: crea partits i revisa convocatòries.',
    entrenador: 'Crees partits i fas les convocatòries del teu equip.',
    familia: 'Veus convocatòries, horaris i resultats dels partits dels teus fills.',
  },
  scouting: {
    admin: 'Jugadors vigilats i plans de partit de tot el club.',
    coordinador: 'Jugadors vigilats i plans de partit de la teva secció, compartits amb els entrenadors.',
    entrenador: 'Fitxes de seguiment de jugadors i el pla de partit del teu equip.',
  },
  potencial: {
    admin: 'Valoracions i històrics de potencial de tot el club (lectura).',
    coordinador: 'Valores el potencial de la secció i en consultes l’evolució històrica.',
    entrenador: "Valores trimestralment els teus jugadors; cada valoració s'afegeix a l'històric.",
    familia: "Reps un informe simplificat amb l'evolució global dels teus fills.",
  },
  comunicacions: {
    admin: 'Envies comunicats a tot el club o per segments.',
    coordinador: "Envies comunicats a la teva secció i als seus entrenadors i famílies.",
    entrenador: 'Envies missatges al teu equip i a les seves famílies.',
    familia: 'Reps comunicats i pots respondre.',
  },
  llicencies: {
    admin: "Veus el pla contractat del club, l'ús actual i les factures.",
  },
  installations: {
    admin: "Gestiones el llistat d'instal·lacions del club, amb la seva adreça.",
    coordinador: "Gestiones el llistat d'instal·lacions del club, amb la seva adreça.",
  },
  club: {
    admin: 'Logo i color del club, que es veuen al tauler i als correus.',
  },
}

export function accessFor(moduleId: ModuleId, role: Role): AccessLevel {
  return ACCESS[moduleId][role]
}

export function allowedModules(role: Role): ModuleDef[] {
  return MODULES.filter((m) => accessFor(m.id, role) !== null)
}
