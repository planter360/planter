-- ============================================================
-- PLAY360 · Migració 014 — categoria de l'equip (masculí /
-- femení / mixt)
--
-- Opcional (null) perquè els equips ja creats no en tenen.
-- "mixt" cobreix les categories inferiors on els equips són mixtos.
--
-- Executa aquest fitxer sencer a: Supabase → SQL Editor → Run
-- ============================================================

alter table public.teams add column if not exists gender text;

alter table public.teams drop constraint if exists teams_gender_check;
alter table public.teams
  add constraint teams_gender_check check (gender is null or gender in ('masculi','femeni','mixt'));
