# Gestió d'accessos pel rollout a clubs reals

Estat actual i pla per al següent mòdul: substituir l'alta manual per SQL per
una pantalla d'gestió d'usuaris dins l'app.

## Estat actual (beta / clubs pilot)

Cada usuari s'alta en dos passos manuals:

1. **Invitació** des del dashboard d'Authentication de Supabase (crea la fila
   a `auth.users` i envia el mail d'accés).
2. **Vinculació** manual per SQL Editor: una fila a `memberships`
   (`user_id`, `club_id`, `role`, `section`) per cada rol que ha de tenir la
   persona, més:
   - **entrenador** → fila a `team_staff` (`team_id`, `user_id`) per cada
     equip que entrena.
   - **família** → fila a la taula de tutors (Setmana 1; nom exacte pendent
     de confirmar al repo) vinculant `user_id` amb el/s `player_id` dels
     seus fills.
   - **coordinador** → `section` ha de coincidir amb la secció dels equips
     que ha de veure.
   - **admin** → sense dependències addicionals, és club-wide.

Això és acceptable amb un o dos clubs pilot (pocs usuaris, alta puntual fet
per nosaltres), però no escala quan calgui donar d'alta un club sencer amb
desenes d'entrenadors i famílies.

## Objectiu pel següent mòdul: "Gestió d'usuaris"

Pantalla dins l'app (accessible per `admin` i `coordinador`, cadascun amb
l'abast que li correspon) per convidar i gestionar accessos sense tocar SQL:

- **Admin**: convida qualsevol rol, a qualsevol secció/equip del club.
- **Coordinador**: convida `entrenador` i `familia` dins la seva pròpia
  secció únicament.
- **Entrenador / família**: sense accés a aquesta pantalla.

### Flux proposat

1. Qui convida omple: correu, rol, i l'abast (secció / equip / jugador
   segons el rol).
2. Un Server Action crida `supabase.auth.admin.inviteUserByEmail` (cal la
   *service role key*, només accessible des del servidor — mai exposar-la
   al client) i, en la mateixa transacció, crea la fila de `memberships`
   (+ `team_staff` o tutoria segons el rol).
3. Si l'usuari convidat ja existeix (altre club, o ja hi és amb un altre
   rol), només s'afegeix la fila de `membership` nova — ja fan servir el
   `membership-switcher.tsx` existent per saltar entre rols/clubs.

### Decisions pendents a prendre quan es construeixi

- **Família lligada des de l'alta de jugador**: probablement té més sentit
  que la invitació de família surti del formulari d'alta/importació d'un
  jugador (demanant el correu del tutor allà mateix) en comptes d'un flux
  separat — evita haver de buscar el `player_id` a mà.
- **Nom exacte de la taula de tutors**: confirmar-lo (via
  `pg_get_functiondef('public.is_guardian_of(uuid)'::regprocedure)`) i
  documentar-lo aquí abans de construir el mòdul.
- **Revocació d'accés**: com es desactiva algú (baixa d'un entrenador,
  canvi de club d'un jugador) — esborrar la fila de `membership`/`team_staff`
  n'hi ha prou, o cal un estat "inactiu" per mantenir l'històric?
- **Límits del pla contractat**: el mòdul de Llicències ja preveu mostrar
  "l'ús actual" del club — la pantalla de convidar hauria de bloquejar-se
  si el club ha arribat al límit d'usuaris del seu pla.

## Relació amb la importació massiva de dades

La importació massiva (equips, jugadors, cos tècnic) deferida anteriorment
hauria d'poder cridar el mateix mecanisme d'alta que aquesta pantalla, per
no duplicar lògica: un club nou es dona d'alta via importació en bloc, els
ajustos puntuals posteriors (un entrenador nou a meitat de temporada) via
aquesta pantalla.
