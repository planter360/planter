-- ============================================================
-- PLAY360 · Migració 008 — mòdul d'Scouting: jugadors vigilats
-- i plans de partit
--
-- Dues entitats independents (amb informació que es pot creuar
-- puntualment, però sense dependència estructural):
--   - scouted_players + scouting_observations: seguiment de
--     jugadors externs (fitxatges potencials o rivals a vigilar).
--   - match_plans: pla de partit per a un partit concret ja
--     existent a "matches" (Setmana 4).
--
-- Visibilitat i escriptura: admin, coordinador de la secció
-- (esport) i entrenador dels equips d'aquest esport. Família no
-- hi té accés (coincideix amb la matriu §2.1).
--
-- Executa aquest fitxer sencer a: Supabase → SQL Editor → Run
-- ============================================================

create table public.scouted_players (
  id            uuid primary key default gen_random_uuid(),
  club_id       uuid not null references public.clubs(id) on delete cascade,
  sport         text not null check (sport in ('futbol','basquet','handbol','volei','futsal')),
  full_name     text not null,
  birth_year    int,
  position      text,
  current_club  text,
  notes         text,
  created_by    uuid not null references auth.users(id),
  created_at    timestamptz not null default now()
);
create index on public.scouted_players (club_id, sport);

alter table public.scouted_players enable row level security;

create policy scouted_players_select on public.scouted_players
  for select using (
    public.has_role(club_id, array['admin'])
    or public.coordinates_sport(club_id, sport)
    or exists (
      select 1 from team_staff ts join teams t on t.id = ts.team_id
      where ts.user_id = auth.uid() and t.club_id = scouted_players.club_id and t.sport = scouted_players.sport
    )
  );

create policy scouted_players_write on public.scouted_players
  for all using (
    public.has_role(club_id, array['admin'])
    or public.coordinates_sport(club_id, sport)
    or exists (
      select 1 from team_staff ts join teams t on t.id = ts.team_id
      where ts.user_id = auth.uid() and t.club_id = scouted_players.club_id and t.sport = scouted_players.sport
    )
  );

create table public.scouting_observations (
  id                 uuid primary key default gen_random_uuid(),
  scouted_player_id  uuid not null references public.scouted_players(id) on delete cascade,
  status             text not null default 'a_seguir' check (status in ('interessant','a_seguir','fitxat','descartat')),
  notes              text,
  observed_at        date,
  created_by         uuid not null references auth.users(id),
  created_at         timestamptz not null default now()
);
create index on public.scouting_observations (scouted_player_id);

alter table public.scouting_observations enable row level security;

create policy scouting_observations_select on public.scouting_observations
  for select using (
    exists (
      select 1 from scouted_players sp
      where sp.id = scouting_observations.scouted_player_id
        and (
          public.has_role(sp.club_id, array['admin'])
          or public.coordinates_sport(sp.club_id, sp.sport)
          or exists (
            select 1 from team_staff ts join teams t on t.id = ts.team_id
            where ts.user_id = auth.uid() and t.club_id = sp.club_id and t.sport = sp.sport
          )
        )
    )
  );

create policy scouting_observations_write on public.scouting_observations
  for all using (
    exists (
      select 1 from scouted_players sp
      where sp.id = scouting_observations.scouted_player_id
        and (
          public.has_role(sp.club_id, array['admin'])
          or public.coordinates_sport(sp.club_id, sp.sport)
          or exists (
            select 1 from team_staff ts join teams t on t.id = ts.team_id
            where ts.user_id = auth.uid() and t.club_id = sp.club_id and t.sport = sp.sport
          )
        )
    )
  );

create table public.match_plans (
  id                 uuid primary key default gen_random_uuid(),
  club_id            uuid not null references public.clubs(id) on delete cascade,
  match_id           uuid not null unique references public.matches(id) on delete cascade,
  content            text,
  scouted_player_ids uuid[] not null default '{}',
  updated_by         uuid not null references auth.users(id),
  updated_at         timestamptz not null default now()
);

alter table public.match_plans enable row level security;

-- club_id es qualifica sempre com a match_plans.club_id: el subquery
-- fa join de matches amb teams i totes dues taules també tenen
-- club_id, així que una referència sense qualificar seria ambigua
-- (el mateix error 42702 que ja vam patir a la migració 002).
create policy match_plans_select on public.match_plans
  for select using (
    public.has_role(match_plans.club_id, array['admin'])
    or exists (
      select 1 from matches m join teams t on t.id = m.team_id
      where m.id = match_plans.match_id and public.coordinates_sport(match_plans.club_id, t.sport)
    )
    or exists (
      select 1 from matches m where m.id = match_plans.match_id and public.manages_team(m.team_id)
    )
  );

create policy match_plans_write on public.match_plans
  for all using (
    public.has_role(match_plans.club_id, array['admin'])
    or exists (
      select 1 from matches m join teams t on t.id = m.team_id
      where m.id = match_plans.match_id and public.coordinates_sport(match_plans.club_id, t.sport)
    )
    or exists (
      select 1 from matches m where m.id = match_plans.match_id and public.manages_team(m.team_id)
    )
  );
