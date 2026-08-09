-- ============================================================
-- PLAY360 · Migració 003 — restringeix memberships.section
-- als mateixos esports vàlids que teams.sport
--
-- Ara mateix "section" és text lliure: un typo ('Futbol' en
-- lloc de 'futbol') fa que el coordinador no vegi mai els seus
-- equips, sense cap avís. Aquest constraint el converteix en un
-- error immediat en comptes d'un bug silenciós.
--
-- Executa aquest fitxer sencer a: Supabase → SQL Editor → Run
-- (cal haver executat abans la migració 002)
-- ============================================================

alter table public.memberships
  add constraint memberships_section_valid
  check (section is null or section in ('futbol','basquet','handbol','volei','futsal'));
