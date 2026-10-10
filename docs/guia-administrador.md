# Planter · Guia d'administrador

Dos nivells d'administració:

1. **[Direcció del club](#part-1--direcció-del-club)** — el rol "Direcció / Junta"
   dins de l'app: usuaris, quotes, marca i pla.
2. **[Operació de Planter](#part-2--operació-de-planter)** — l'equip de Planter:
   donar d'alta clubs, base de dades, correu i desplegament.

---

# Part 1 · Direcció del club

## Qui fa què

| Tasca | Qui | On |
|---|---|---|
| Crear equips i assignar-hi entrenador | Coordinador de la secció | Plantilles → + Nou equip |
| Donar d'alta jugadors | Coordinador o entrenador | Pàgina de l'equip |
| Vincular famílies als jugadors | Direcció, coordinador o entrenador | Fitxa del jugador → Família |
| Convidar entrenadors nous | Direcció o coordinador | Nou equip / pàgina de l'equip |
| Afegir coordinadors i direcció | Planter (de moment) | Vegeu la [part 2](#rols-de-coordinador-i-direcció) |
| Emetre rebuts | Direcció | Pagaments → + Nou rebut |
| Logo i color del club | Direcció | Configuració |

## Usuaris

Ningú té contrasenya: tothom entra amb un enllaç que rep per correu. Per donar
accés a algú només cal el seu correu.

- **Entrenadors**: en crear un equip (o a la pàgina de l'equip → *Assignar
  entrenador/a*) tria'n un d'existent o escriu nom i correu d'un de nou. Si
  encara no té compte, rep un correu d'invitació i, el primer cop que entra,
  queda vinculat automàticament a l'equip.
- **Famílies**: a la fitxa de cada jugador → *Família* → *+ Afegir familiar*.
  Un familiar pot estar vinculat a diversos jugadors (germans). Si s'equivoca
  el correu, *Treure* elimina el vincle o la invitació pendent.
- Una mateixa persona pot tenir diversos rols (per exemple, entrenador i
  família). Canvia de vista amb el desplegable de baix del menú.

## Quotes i rebuts

1. **Pagaments → + Nou rebut**: jugador, concepte, import i data de venciment.
2. Les famílies vinculades al jugador reben un correu amb el rebut. Si el
   jugador no té cap familiar vinculat, l'app t'avisa.
3. Quan la família pagui, marca el rebut com a **pagat**. Si passa la data,
   marca'l com a **vençut**.
4. Les targetes **Cobrat / Pendent / Vençut** mostren els totals i, en
   clicar-les, filtren el llistat.

El cobrament en línia (targeta, Bizum, domiciliació) encara no està actiu.

## Marca del club

**Configuració** → puja el logo (PNG, JPG o WebP, fins a 1 MB; millor quadrat
i amb fons transparent) i tria el color del club. A la dreta en veus una
previsualització.

- El color s'aplica al menú, als botons i als enllaços de tot el tauler, per a
  tots els rols, i als correus que envia l'app.
- Planter rebutja els colors massa clars (grocs, pastels): el text blanc dels
  botons no es llegiria.
- El login i els correus d'accés continuen amb la imatge de Planter.

## Pla i ús

**Llicències** mostra el pla contractat i l'ús actual: jugadors, equips i
usuaris per rol. El pla el canvia Planter.

---

# Part 2 · Operació de Planter

## Arquitectura

- **App**: Next.js 16 a Vercel. Cada push a `main` es desplega automàticament.
- **Base de dades i accés**: Supabase (Postgres amb RLS). La seguretat la fa la
  base de dades: l'app només amaga el que cada rol no ha de veure, però les
  polítiques RLS i les funcions `security definer` són les que ho impedeixen.
- **Correu**: dos canals.
  - Correus de login → SMTP configurat a Supabase.
  - Correus de l'app (invitacions, rebuts) → SMTP des de Vercel
    ([lib/email.ts](../lib/email.ts)).

## Donar d'alta un club nou

1. Crea el club (SQL Editor de Supabase). El `slug` ha de ser únic, en
   minúscules i sense espais:

   ```sql
   insert into public.clubs (name, slug, plan)
   values ('CE Exemple', 'ce-exemple', 'pilot')
   returning id;
   ```

2. La persona de direcció del club entra a `/login` amb el seu correu. Així es
   crea el seu compte; veurà "Encara no tens cap club assignat".
3. Dona-li el rol de direcció (substitueix l'ID del club i el correu):

   ```sql
   insert into public.memberships (club_id, user_id, role)
   select '<CLUB_ID>', u.id, 'admin'
   from auth.users u
   where lower(u.email) = lower('direccio@exemple.cat')
   on conflict (club_id, user_id, role) do nothing;
   ```

4. Afegeix els coordinadors (vegeu l'apartat següent). A partir d'aquí, el club
   ja crea equips, convida entrenadors i vincula famílies des de l'app.

### Rols de coordinador i direcció

Encara no hi ha pantalla per a aquests dos rols. Cada coordinador té una secció
(esport): `futbol`, `basquet`, `handbol`, `volei`, `futsal` o `hockey`. La
persona ha d'haver entrat abans un cop a `/login`.

```sql
insert into public.memberships (club_id, user_id, role, section)
select '<CLUB_ID>', u.id, 'coordinador', 'futbol'
from auth.users u
where lower(u.email) = lower('coordinacio@exemple.cat')
on conflict (club_id, user_id, role) do nothing;
```

### Canviar el pla d'un club

Valors possibles: `pilot`, `starter`, `club`, `elit`.

```sql
update public.clubs set plan = 'club' where slug = 'ce-exemple';
```

## Migracions de base de dades

Els fitxers `supabase-migration-NNN-*.sql` de l'arrel del repositori s'executen
a mà, en ordre, a **Supabase → SQL Editor**. Abans de cada fitxer, buida
l'editor perquè no hi quedi text de l'anterior.

| # | Què fa |
|---|---|
| 002 | Limita jugadors i valoracions a l'equip o la secció de cadascú |
| 003 | Valida la secció dels coordinadors (la 011 la substitueix) |
| 004 | Permís per a la consulta d'estat de cobrament per equip |
| 005 | Permet veure el nom d'altres membres del club |
| 006 | Jugadors en més d'un equip (`player_teams`) |
| 007 | Pla de pluja a l'horari setmanal |
| 008 | Scouting: jugadors vigilats, observacions, plans de partit |
| 009 | Limita qui pot valorar a Potencial |
| 010 | Instal·lacions |
| 011 | Afegeix hockey als esports vàlids |
| 012 | Adreça de partits fora de casa; valoració a Scouting |
| 013 | Historial d'equips del jugador; resum de Potencial per a famílies |
| 014 | Categoria de l'equip (masculí, femení, mixt) |
| 015 | Convidar i assignar entrenadors |
| 016 | Vincular famílies als jugadors |
| 017 | Logo i color del club; correcció dels noms a les invitacions |

Per comprovar què s'ha aplicat, busca a la base de dades l'objecte que crea
cada migració. Per exemple:
`select exists(select 1 from information_schema.tables where table_name = 'installations');`

## Correu

### Beta (sense domini propi): Gmail

- **Supabase → Authentication → Emails → SMTP Settings**: host
  `smtp.gmail.com`, port `465`, usuari i remitent `hola.planter@gmail.com`,
  contrasenya = contrasenya d'aplicació de Google
  (`myaccount.google.com/apppasswords`).
- **Vercel → Settings → Environment Variables** (després, *Redeploy*):

  | Variable | Valor |
  |---|---|
  | `SMTP_HOST` | `smtp.gmail.com` |
  | `SMTP_PORT` | `465` |
  | `SMTP_USER` | `hola.planter@gmail.com` |
  | `SMTP_PASS` | la contrasenya d'aplicació (marca-la com a *Sensitive*) |
  | `EMAIL_FROM` | `Planter <hola.planter@gmail.com>` |

Si aquestes variables no hi són, l'app continua funcionant: les invitacions es
creen igualment i la pantalla avisa que no s'ha enviat el correu.

### Llançament (amb domini propi): Resend

1. Compra el domini. Si el compres a Vercel → Domains, ja queda connectat a
   l'app.
2. Resend → Domains → afegeix el domini i crea els registres DNS que et demana
   (DKIM, SPF i DMARC). Copia els valors amb el botó de copiar.
3. Supabase SMTP: host `smtp.resend.com`, port `465`, usuari `resend`,
   contrasenya = API key de Resend, remitent `hola@eldomini.cat`.
4. Vercel: les mateixes variables `SMTP_*` apuntant a Resend, i `EMAIL_FROM`
   amb el domini.

### Plantilles dels correus de login

Supabase → Authentication → Emails → **Templates**. Enganxa el contingut de
[email-templates/supabase-login.html](email-templates/supabase-login.html) a
les plantilles **Magic Link** i **Confirm signup**, amb l'assumpte
`El teu enllaç d'accés a Planter`.

## Abans de llançar

- [ ] Domini propi i correu via Resend (apartat anterior).
- [ ] Actualitzar Next.js a l'última versió 16.2.x (hi ha un avís de seguretat
      a la versió actual). Provar-ho en una branca abans de fusionar.
- [ ] Revisar a Supabase → Authentication → Rate Limits el límit de correus
      per hora.
- [ ] Còpies de seguretat: comprovar quines inclou el pla actual de Supabase
      i, si no n'hi ha de recuperables, passar al pla Pro abans de tenir dades
      reals de clubs.
- [ ] Pantalla per gestionar coordinadors i direcció, i backoffice d'alta de
      clubs (ara són per SQL).
- [ ] Cobrament de quotes en línia (Stripe o GoCardless) i subscripció dels
      clubs a Planter.
