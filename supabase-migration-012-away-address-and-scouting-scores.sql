-- ============================================================
-- PLAY360 · Migració 012 — adreça de visitant a Partits i
-- valoracions per categoria a Scouting
--
-- matches.place_address: quan el partit és fora de casa, el lloc
-- no és cap instal·lació pròpia del club, així que cal poder
-- escriure una adreça lliure perquè l'enllaç de Maps funcioni
-- igualment.
--
-- scouting_observations.tec/fis/tac/men: mateixes 4 categories
-- que assessments (Potencial), però opcionals — una observació
-- d'scouting pot ser només una nota ràpida sense valoració
-- formal.
--
-- Executa aquest fitxer sencer a: Supabase → SQL Editor → Run
-- ============================================================

alter table public.matches add column if not exists place_address text;

alter table public.scouting_observations
  add column if not exists tec int,
  add column if not exists fis int,
  add column if not exists tac int,
  add column if not exists men int;

alter table public.scouting_observations drop constraint if exists scouting_observations_tec_check;
alter table public.scouting_observations drop constraint if exists scouting_observations_fis_check;
alter table public.scouting_observations drop constraint if exists scouting_observations_tac_check;
alter table public.scouting_observations drop constraint if exists scouting_observations_men_check;

alter table public.scouting_observations
  add constraint scouting_observations_tec_check check (tec is null or tec between 1 and 5),
  add constraint scouting_observations_fis_check check (fis is null or fis between 1 and 5),
  add constraint scouting_observations_tac_check check (tac is null or tac between 1 and 5),
  add constraint scouting_observations_men_check check (men is null or men between 1 and 5);
