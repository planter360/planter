-- ============================================================
-- PLAY360 · Migració 005 — permet veure el nom d'altres membres
-- del mateix club (calia per mostrar l'autor d'un comunicat)
--
-- Problema: profiles_own (Setmana 1) només deixa veure el TEU
-- propi perfil. Qualsevol join a profiles per mostrar qui ha
-- escrit un comunicat (o, més endavant, qui entrena un equip)
-- tornava null per a tothom que no fos l'autor mateix.
--
-- Aquesta política només amplia SELECT (es combina amb OR sobre
-- profiles_own, que ja existeix i és "for all"); update/insert/
-- delete del teu perfil segueixen restringits al teu propi id.
--
-- Executa aquest fitxer sencer a: Supabase → SQL Editor → Run
-- ============================================================

create policy profiles_clubmates on public.profiles
  for select using (
    exists (
      select 1 from memberships m1
      join memberships m2 on m1.club_id = m2.club_id
      where m1.user_id = auth.uid() and m2.user_id = profiles.id
    )
  );
