-- ============================================================
-- PLAY360 · Migració 004 — assegura que l'entrenador pot cridar
-- team_payment_status des del client (mòdul de Pagaments)
--
-- La funció ja existia a l'esquema inicial, però mai s'havia
-- cridat via RPC des del navegador. Si el rol "authenticated"
-- (el que fa servir qualsevol usuari amb sessió) no té permís
-- explícit d'EXECUTE, la crida falla encara que la funció sigui
-- security definer. Aquest GRANT és inofensiu d'executar encara
-- que ja hi fos.
--
-- Executa aquest fitxer sencer a: Supabase → SQL Editor → Run
-- ============================================================

grant execute on function public.team_payment_status(uuid) to authenticated;
