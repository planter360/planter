-- ============================================================
-- PLAY360 · Migració 002 — corregeix l'abast de visibilitat
-- de players i assessments (dades de menors, sensibles RGPD)
--
-- Problema: les polítiques players_select i assessments_select
-- fetes a la Setmana 1 feien servir is_staff(club_id), que dona
-- accés a QUALSEVOL admin/coordinador/entrenador del club a TOTS
-- els jugadors i totes les valoracions, encara que no siguin del
-- seu equip o secció. Això contradiu la matriu de visibilitat
-- (§2.1 de l'especificació): l'entrenador només hauria de veure
-- el seu equip, i el coordinador només la seva secció.
--
-- Executa aquest fitxer sencer a: Supabase → SQL Editor → Run
-- ============================================================

drop policy if exists players_select on public.players;
create policy players_select on public.players
  for select using (
    public.has_role(players.club_id, array['admin'])
    or exists (
      select 1 from teams t
      where t.id = players.team_id and public.coordinates_sport(players.club_id, t.sport)
    )
    or public.manages_team(players.team_id)
    or public.is_guardian_of(players.id)
  );

drop policy if exists assessments_select on public.assessments;
create policy assessments_select on public.assessments
  for select using (
    public.has_role(assessments.club_id, array['admin'])
    or exists (
      select 1 from players p join teams t on t.id = p.team_id
      where p.id = assessments.player_id and public.coordinates_sport(assessments.club_id, t.sport)
    )
    or exists (
      select 1 from players p where p.id = assessments.player_id and public.manages_team(p.team_id)
    )
  );
