# Planter · Beta: estat, proves i calendari

Document de treball per tancar la primera beta. Data: 10 d'octubre de 2026.

1. [Què tenim](#1-què-tenim)
2. [Configuració prèvia a les proves](#2-configuració-prèvia-a-les-proves)
3. [Escenaris de prova](#3-escenaris-de-prova)
4. [Limitacions conegudes](#4-limitacions-conegudes)
5. [Següents passos i calendari](#5-següents-passos-i-calendari)

---

## 1. Què tenim

### Producte

App web multi-club i multiesport (futbol, bàsquet, handbol, vòlei, futsal i
hoquei), adaptada a mòbil. Hi ha quatre rols, i cadascun veu una versió
diferent de cada mòdul.

| Mòdul | Què fa |
|---|---|
| **Visió 360** | Calendari setmanal (entrenaments i partits) per a tots els rols; accés al llistat de jugadors |
| **Jugadors** | Llistat amb cerca i filtre per equip; fitxa de cada jugador |
| **Fitxa de jugador** | Dades, equips actuals i historial, % d'assistència, convocatòries, potencial, família vinculada |
| **Plantilles** | Equips amb categoria (masculí, femení, mixt) i filtre; alta individual i múltiple de jugadors; jugadors en un segon equip; canvi d'equip |
| **Entrenaments** | Horari setmanal amb instal·lació i pla de pluja; sessions i assistència; graella d'ocupació |
| **Partits** | Local o visitant amb enllaç a Google Maps; convocatòries amb confirmació de les famílies; resultats |
| **Pagaments** | Rebuts manuals; avís per correu a les famílies; filtres cobrat, pendent i vençut |
| **Comunicacions** | Comunicats al club, a les famílies, a una secció o a equips concrets |
| **Potencial** | Valoració 1–5 en tècnica, físic, tàctic i mental, amb historial i % d'evolució; resum simplificat per a famílies |
| **Scouting** | Jugadors vigilats amb observacions i valoració; plans de partit |
| **Instal·lacions** | Pistes amb adreça; calendari d'ocupació amb solapaments |
| **Configuració** | Logo i color del club, aplicats a tot el tauler i als correus |
| **Llicències** | Pla del club i ús |

### Gestió d'usuaris

- Accés sense contrasenyes: enllaç màgic per correu.
- **Entrenadors**: el coordinador els tria o els convida en crear o editar un
  equip.
- **Famílies**: es vinculen des de la fitxa del jugador.
- Les invitacions a persones que encara no tenen compte s'activen soles en el
  primer accés.
- **Direcció i coordinadors**: encara per SQL (vegeu la
  [guia d'administrador](guia-administrador.md)).

### Infraestructura

- Next.js 16 a Vercel, amb desplegament automàtic des de `main`.
- Supabase (Postgres) amb seguretat per files (RLS) per rol.
- Correu per SMTP (Gmail durant la beta), tant el de login com el de l'app.
- 16 migracions SQL (de la 002 a la 017), que s'executen a mà.

### Documentació

[Guia d'usuari](guia-usuari.md) · [Guia d'administrador](guia-administrador.md) ·
[Gestió d'accessos](rollout-gestio-accessos.md) ·
[Presentació per a clubs](presentacions/planter-clubs.pptx) ·
[Presentació per a inversors](presentacions/planter-inversors.pptx)

---

## 2. Configuració prèvia a les proves

Cal fer-ho tot abans de començar; si no, alguns escenaris fallaran per motius
de configuració i no per errors del producte.

- [ ] Totes les migracions aplicades a Supabase, de la 002 a la 017. Comprova
      especialment la 005, 006, 007, 013, 014, 015, 016 i 017
      ([com comprovar-ho](guia-administrador.md#migracions-de-base-de-dades)).
- [ ] SMTP de Supabase amb Gmail i contrasenya d'aplicació.
- [ ] Variables `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` i
      `EMAIL_FROM` a Vercel, i *Redeploy*.
- [ ] Plantilla [supabase-login.html](email-templates/supabase-login.html)
      enganxada a "Magic Link" i "Confirm signup".
- [ ] Un club de proves amb:
  - una persona de direcció;
  - dos coordinadors de seccions diferents (per exemple, futbol i bàsquet);
  - per a les proves, cinc correus diferents: direcció, coordinador A,
    coordinador B, entrenador i família (els àlies de Gmail tipus
    `nom+entrenador@gmail.com` serveixen).

---

## 3. Escenaris de prova

Com fer-les:
- Marca cada prova quan el resultat coincideixi amb el que s'espera.
- Si no coincideix, anota-ho amb una captura.
- Fes servir finestres d'incògnit diferents per a cada rol, perquè no es
  barregin les sessions.

### A. Accés

| # | Passos | Resultat esperat | OK |
|---|---|---|---|
| A1 | Demanar l'enllaç a /login amb un correu nou i obrir-lo al mateix navegador | Entra; si no té club, surt "Encara no tens cap club assignat" | [ ] |
| A2 | Obrir l'enllaç en un altre navegador o dispositiu | No entra (comportament esperat) | [ ] |
| A3 | Demanar diversos enllaços seguits | Missatge clar d'esperar uns minuts | [ ] |
| A4 | Tancar el navegador, tornar-lo a obrir l'endemà | Continua amb la sessió iniciada | [ ] |
| A5 | Usuari amb dos rols canvia de rol al desplegable del menú | El menú i les dades canvien segons el rol | [ ] |
| A6 | Tanca sessió | Torna a /login | [ ] |
| A7 | Correu de login | Arriba amb el disseny de Planter i el botó funciona | [ ] |

### B. Direcció

| # | Passos | Resultat esperat | OK |
|---|---|---|---|
| B1 | Configuració → pujar un logo PNG i triar un color fosc → Desar | Logo al menú i color als botons i al menú, per a tots els rols | [No s’ha pogut pujar: Bucket not found] |
| B2 | Triar un color molt clar (groc) | No es deixa desar i s'explica per què | [An error occurred in the Server Components render. The specific message is omitted in production builds to avoid leaking sensitive details. A digest property is included on this error instance which may provide additional details about the nature of the error.] |
| B3 | Pujar un fitxer de més d'1 MB o un SVG | Es rebutja amb missatge | [Pendent] |
| B4 | Llicències | Pla "Pilot" i recomptes correctes | [La part d'usuaris es incorrecte; jugadors i equips es correcte] |
| B5 | Pagaments → + Nou rebut a un jugador amb família vinculada | Rebut creat; la família rep el correu amb el logo i el color del club | [Rebut emès. Aquest jugador no té cap familiar vinculat: ningú n’ha rebut l’avís.; No es pot vincular jugadors amb familiars des de la aplicació] |
| B6 | Nou rebut a un jugador sense família | Avís en ambre: ningú n'ha rebut l'avís | [Ok] |
| B7 | Clicar Cobrat, Pendent i Vençut; tornar a clicar | El llistat es filtra; el segon clic treu el filtre | [Ok] |
| B8 | Marcar un rebut com a pagat | Passa a Cobrat i els totals s'actualitzen | [Ok] |
| B9 | Comunicat a "Equips concrets" (dos equips) | Només el veuen els entrenadors i les famílies d'aquests equips | [Pendent del test complet; filtres correcte] |
| B10 | Visió 360 | Calendari amb tots els equips del club | [Ok] |

### C. Coordinació

| # | Passos | Resultat esperat | OK |
|---|---|---|---|
| C1 | + Nou equip amb categoria i entrenador existent | Equip creat; apareix a la Visió 360 de l'entrenador | [ ] |
| C2 | + Nou equip amb entrenador nou (nom + correu sense compte) | Correu d'invitació; en el primer accés, l'entrenador ja té l'equip i surt amb el seu nom | [ ] |
| C3 | Canviar la categoria d'un equip existent i filtrar per categoria | El filtre mostra l'equip a la categoria nova | [ ] |
| C4 | Alta múltiple enganxant files d'un Excel | La previsualització és correcta i es creen tots els jugadors | [ ] |
| C5 | Vincular un jugador a un segon equip | Surt a "també hi entrenen" i a la convocatòria del segon equip | [ ] |
| C6 | Fitxa del jugador → Canviar d'equip | Historial amb l'equip antic tancat i el nou obert | [ ] |
| C7 | Instal·lacions → crear pista amb adreça | L'adreça obre Google Maps | [ ] |
| C8 | Dos equips a la mateixa pista i hora → calendari d'ocupació | Els dos blocs surten en vermell (solapament) | [Pendent] |
| C9 | Pagaments de la secció | Només rebuts de la seva secció; els filtres funcionen | [Ok] |
| C10 | Visió 360 | Calendari amb els equips de la seva secció i xifra d'equips correcta | [Ok] |

### D. Entrenador

| # | Passos | Resultat esperat | OK |
|---|---|---|---|
| D1 | Entrenaments → Definir horari setmanal (instal·lació del desplegable) | Es desa i surt a la Visió 360 i a la graella | [ ] |
| D2 | Afegir lloc de pluja i activar el pla | El lloc canvia a tot arreu i es marca "pla de pluja" | [ ] |
| D3 | + Nova sessió i passar llista | Tothom present per defecte; es pot desmarcar | [ ] |
| D4 | + Nou partit local | El lloc enllaça a Maps amb l'adreça de la instal·lació | [ ] |
| D5 | + Nou partit visitant amb adreça | El lloc enllaça a Maps amb l'adreça escrita | [ ] |
| D6 | Fer la convocatòria | La família la veu i pot confirmar | [ ] |
| D7 | Afegir resultat | Visible per a família, coordinació i direcció | [ ] |
| D8 | Potencial: dues valoracions al mateix jugador | La segona mostra el % de canvi | [ ] |
| D9 | Scouting: jugador vigilat + observació amb valoració + pla de partit | Tot visible per als altres entrenadors i el coordinador de la secció | [ ] |
| D10 | Fitxa del jugador → + Afegir familiar (correu sense compte) | Correu d'invitació; estat "Pendent d'entrar" | [ ] |
| D11 | Comunicat a un equip | El reben només les famílies d'aquell equip | [ ] |
| D12 | Pagaments | Veu si els jugadors estan al dia, sense imports | [ ] |
| D13 | Visió 360 → targeta Jugadors | Llistat dels seus jugadors; la cerca funciona | [ ] |

### E. Família

| # | Passos | Resultat esperat | OK |
|---|---|---|---|
| E1 | Primer accés amb el correu de la invitació (D10) | Veu el seu fill sense cap pas més; a la fitxa del jugador ja no surt "Pendent" | [ ] |
| E2 | Visió 360 | Calendari dels equips del fill (inclòs l'equip secundari, si n'hi ha) | [ ] |
| E3 | Entrenaments → marcar que no hi anirà | L'entrenador ho veu a la sessió | [ ] |
| E4 | Partits → confirmar la convocatòria | L'entrenador veu la confirmació | [ ] |
| E5 | Pagaments | Només els rebuts dels seus fills | [ ] |
| E6 | Potencial | Mitjana i % d'evolució, sense desglossament ni notes | [ ] |
| E7 | Comunicacions | Només els comunicats adreçats al club, a les famílies o als equips dels fills | [ ] |
| E8 | Família amb dos fills en equips diferents | Ho veu tot dels dos | [ ] |

### F. Seguretat (proves negatives)

| # | Passos | Resultat esperat | OK |
|---|---|---|---|
| F1 | Família → /dashboard/jugadors | Només els seus fills | [ ] |
| F2 | Família → /dashboard/scouting i /dashboard/club escrits a mà | "No tens accés a aquest mòdul" | [ ] |
| F3 | Família → fitxa d'un altre jugador (copiar la URL d'un entrenador) | Pàgina no trobada | [ ] |
| F4 | Entrenador → URL d'un equip que no és seu | No hi veu jugadors | [ ] |
| F5 | Coordinador A → jugadors i rebuts de la secció B | No els veu | [ ] |
| F6 | Coordinador → /dashboard/club | "No tens accés a aquest mòdul" | [ ] |
| F7 | Entrenador → Pagaments | Cap import ni dada bancària | [ ] |

### G. Mòbil i correu

| # | Passos | Resultat esperat | OK |
|---|---|---|---|
| G1 | Navegar des del mòbil | Menú ☰; cap pantalla amb scroll lateral, excepte taules amples | [ ] |
| G2 | Visió 360 al mòbil | Calendari en format agenda | [ ] |
| G3 | Correus d'invitació i de rebut a Gmail i Outlook | Es veuen bé (logo, color, botó) i no arriben a correu brossa | [ ] |

---

## 4. Limitacions conegudes

No són errors: és l'abast actual de la beta.

- Coordinadors, direcció i alta de clubs: només per SQL.
- Sense cobrament en línia: els rebuts es marquen com a pagats a mà.
- Sense domini propi: correu des de Gmail (límit d'uns 500 correus al dia) i
  URL `planter-livid.vercel.app`.
- L'historial d'equips comença el dia que es va aplicar la migració 013.
- Les valoracions de Potencial no es poden editar ni esborrar.
- Un equip mostra un sol nom d'entrenador, encara que en pugui tenir diversos.
- Avís de seguretat pendent a la versió actual de Next.js.
- **Dos permisos que filtra la pantalla però no la base de dades:**
  - qualsevol coordinador pot llegir els rebuts de tot el club (la pantalla
    només li mostra els de la seva secció);
  - qui pot veure cada comunicat el decideix l'app, no la base de dades.

  Les proves F5 i E7 passen igualment, però s'han de tancar a la base de
  dades abans de tenir dades reals (fase 0).

---

## 5. Següents passos i calendari

Proposta de dates: ajusta-les segons la disponibilitat de l'equip i del club
pilot.

| Fase | Dates | Objectiu | Tasques | Fet quan… |
|---|---|---|---|---|
| **0. Preparació** | 13 – 17 oct | Entorn llest | Configuració de l'apartat 2; limitar a la base de dades els rebuts per secció i els comunicats per destinatari; proves A–G amb comptes interns; corregir els errors bloquejants | Totes les proves de seguretat (F) passen |
| **1. Beta tancada** | 20 oct – 7 nov | Club pilot amb dades reals | Alta del club pilot; equips i jugadors per alta múltiple; invitar entrenadors; vincular famílies d'1–2 equips; sessió de formació amb la guia d'usuari | Entrenadors i famílies fan servir l'app una setmana sense ajuda |
| **2. Correccions** | 10 – 21 nov | Estabilitat | Feedback del pilot; actualitzar Next.js; revisar còpies de seguretat de Supabase | Cap error obert de prioritat alta |
| **3. Preparar llançament** | 10 – 28 nov | Llest per a clubs de pagament | Domini propi; correu via Resend; preus dels plans; completar els camps "[Pendent]" de les presentacions | Correus des del domini i preus decidits |
| **4. Llançament** | 1 – 19 des | 2–3 clubs | Alta dels clubs; formació; seguiment setmanal | Clubs actius i facturant (o compromesos per al gener) |
| **5. Fase 1b** | gen – feb 2027 | Escalar sense nosaltres | Cobrament de quotes en línia (Stripe o GoCardless); pantalla per gestionar coordinadors i direcció; alta de clubs autoservei | Un club nou s'incorpora sense cap SQL |

### Fites

- **17 oct**: entorn configurat i proves internes superades.
- **20 oct**: club pilot donat d'alta.
- **7 nov**: final de la beta tancada; recull de feedback.
- **28 nov**: domini, correu i preus llestos.
- **1 des**: llançament amb els primers clubs.
- **28 feb 2027**: cobrament en línia i autoservei actius.
