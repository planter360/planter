-- ============================================================
-- PLAY360 · Migració 011 — afegeix "hockey" als esports vàlids
--
-- lib/sports.ts ja inclou 'hockey', però les constraints de
-- memberships.section (migració 003) i scouted_players.sport
-- (migració 008) encara només admeten futbol/basquet/handbol/
-- volei/futsal. Sense això, triar "Hockey" a qualsevol desplegable
-- de l'app (secció d'un coordinador, esport d'una fitxa d'scouting)
-- falla amb una violació de constraint a la base de dades.
--
-- Executa aquest fitxer sencer a: Supabase → SQL Editor → Run
-- ============================================================

alter table public.memberships drop constraint memberships_section_valid;
alter table public.memberships
  add constraint memberships_section_valid
  check (section is null or section in ('futbol','basquet','handbol','volei','futsal','hockey'));

alter table public.scouted_players drop constraint scouted_players_sport_check;
alter table public.scouted_players
  add constraint scouted_players_sport_check
  check (sport in ('futbol','basquet','handbol','volei','futsal','hockey'));
