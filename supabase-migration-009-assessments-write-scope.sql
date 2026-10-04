-- ============================================================
-- PLAY360 · Migració 009 — restringeix l'escriptura d'assessments
-- al mateix abast que la lectura
--
-- Problema: assessments_write (Setmana 1) fa servir
-- has_role(club_id, ['coordinador','entrenador']), que dona permís
-- a QUALSEVOL coordinador o entrenador del club per valorar
-- QUALSEVOL jugador, encara que no sigui de la seva secció/equip.
-- Mateix forat que vam corregir a la migració 002 per
-- players_select/assessments_select, ara al INSERT.
--
-- Executa aquest fitxer sencer a: Supabase → SQL Editor → Run
-- ============================================================

drop policy if exists assessments_write on public.assessments;
create policy assessments_write on public.assessments
  for insert with check (
    exists (
      select 1 from players p join teams t on t.id = p.team_id
      where p.id = assessments.player_id and public.coordinates_sport(assessments.club_id, t.sport)
    )
    or exists (
      select 1 from players p where p.id = assessments.player_id and public.manages_team(p.team_id)
    )
  );
