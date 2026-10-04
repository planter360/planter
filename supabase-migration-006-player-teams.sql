-- ============================================================
-- PLAY360 · Migració 006 — jugadors amb doble dinàmica d'equips
--
-- Problema: players.team_id només permet un equip per jugador.
-- Un cadet que també entrena/juga amb el juvenil no es pot
-- representar. Aquesta migració afegeix player_teams com a
-- vincles ADDICIONALS (players.team_id segueix sent l'equip
-- principal; no es toca ni es migra res existent).
--
-- Qui gestiona els vincles: admin i el coordinador de la secció
-- de l'equip al qual es vincula el jugador (mateix criteri que
-- "moviments entre equips" de l'especificació §3.2).
--
-- Executa aquest fitxer sencer a: Supabase → SQL Editor → Run
-- ============================================================

create table public.player_teams (
  id         uuid primary key default gen_random_uuid(),
  club_id    uuid not null references public.clubs(id) on delete cascade,
  player_id  uuid not null references public.players(id) on delete cascade,
  team_id    uuid not null references public.teams(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (player_id, team_id)
);
create index on public.player_teams (team_id);
create index on public.player_teams (player_id);

alter table public.player_teams enable row level security;

create policy player_teams_select on public.player_teams
  for select using (
    public.has_role(club_id, array['admin'])
    or exists (select 1 from teams t where t.id = team_id and public.coordinates_sport(club_id, t.sport))
    or public.manages_team(team_id)
    or public.is_guardian_of(player_id)
  );

create policy player_teams_write on public.player_teams
  for all using (
    public.has_role(club_id, array['admin'])
    or exists (select 1 from teams t where t.id = team_id and public.coordinates_sport(club_id, t.sport))
  );

-- Amplia players_select (ja corregida a la migració 002) perquè el
-- cos tècnic d'un equip SECUNDARI també vegi els jugadors vinculats
-- via player_teams, no només els del seu equip principal.
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
    or exists (
      select 1 from player_teams pt
      where pt.player_id = players.id
        and (
          public.manages_team(pt.team_id)
          or exists (select 1 from teams t2 where t2.id = pt.team_id and public.coordinates_sport(players.club_id, t2.sport))
        )
    )
  );
