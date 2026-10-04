-- ============================================================
-- PLAY360 · Migració 007 — pla de pluja a l'horari setmanal
--
-- Alguns equips entrenen a pistes exteriors i necessiten un lloc
-- alternatiu cobert per als dies de pluja. S'afegeix com a camps
-- opcionals a trainings (no calen taules noves ni canvis a RLS:
-- trainings_write ja cobreix aquest update).
--
-- Executa aquest fitxer sencer a: Supabase → SQL Editor → Run
-- ============================================================

alter table public.trainings
  add column rain_place text,
  add column rain_active boolean not null default false;
