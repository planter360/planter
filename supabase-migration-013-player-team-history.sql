-- ============================================================
-- PLAY360 · Migració 013 — historial d'equips del jugador i
-- resum de Potencial per a famílies
--
-- Requereix haver executat abans la 006 (player_teams).
--
-- 1) player_team_history: cada vegada que un jugador entra o surt
--    d'un equip (principal via players.team_id, secundari via
--    player_teams), un trigger ho registra. Es guarda també el nom
--    de l'equip, perquè l'historial sobrevisqui si l'equip s'esborra.
--    Ningú hi escriu directament: només els triggers (security
--    definer). La lectura segueix la visibilitat de players.
--
-- 2) guardian_assessment_summary: assessments_select no inclou les
--    famílies, així que la vista simplificada de Potencial no rebia
--    res. En comptes d'obrir la taula sencera (amb notes de
--    l'entrenador i el desglossament), aquesta funció només retorna
--    data + mitjana, i només per als fills del qui la crida.
--
-- Executa aquest fitxer sencer a: Supabase → SQL Editor → Run
-- ============================================================

create table if not exists public.player_team_history (
  id         uuid primary key default gen_random_uuid(),
  club_id    uuid not null references public.clubs(id) on delete cascade,
  player_id  uuid not null references public.players(id) on delete cascade,
  team_id    uuid references public.teams(id) on delete set null,
  team_name  text not null,
  kind       text not null check (kind in ('principal','secundari')),
  started_at date not null default current_date,
  ended_at   date
);
create index if not exists player_team_history_player_idx on public.player_team_history (player_id);

alter table public.player_team_history enable row level security;

-- El subquery a players aplica la RLS de players: qui veu el jugador
-- veu el seu historial, i ningú més.
drop policy if exists player_team_history_select on public.player_team_history;
create policy player_team_history_select on public.player_team_history
  for select using (
    exists (select 1 from players p where p.id = player_team_history.player_id)
  );

create or replace function public.track_primary_team_history() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'UPDATE' then
    if new.team_id is not distinct from old.team_id then
      return new;
    end if;
    update player_team_history
      set ended_at = current_date
      where player_id = new.id and kind = 'principal' and ended_at is null;
  end if;

  if new.team_id is not null then
    insert into player_team_history (club_id, player_id, team_id, team_name, kind)
      select new.club_id, new.id, t.id, t.name, 'principal' from teams t where t.id = new.team_id;
  end if;
  return new;
end $$;

drop trigger if exists players_team_history on public.players;
create trigger players_team_history
  after insert or update of team_id on public.players
  for each row execute function public.track_primary_team_history();

create or replace function public.track_secondary_team_history() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into player_team_history (club_id, player_id, team_id, team_name, kind)
      select new.club_id, new.player_id, t.id, t.name, 'secundari' from teams t where t.id = new.team_id;
    return new;
  end if;

  update player_team_history
    set ended_at = current_date
    where player_id = old.player_id and team_id = old.team_id and kind = 'secundari' and ended_at is null;
  return old;
end $$;

drop trigger if exists player_teams_history on public.player_teams;
create trigger player_teams_history
  after insert or delete on public.player_teams
  for each row execute function public.track_secondary_team_history();

-- Punt de partida: l'equip actual de cada jugador (no sabem des de
-- quan hi és, així que es marca amb la data d'avui).
insert into public.player_team_history (club_id, player_id, team_id, team_name, kind)
  select p.club_id, p.id, t.id, t.name, 'principal'
  from public.players p join public.teams t on t.id = p.team_id
  where not exists (
    select 1 from public.player_team_history h where h.player_id = p.id and h.kind = 'principal'
  );

insert into public.player_team_history (club_id, player_id, team_id, team_name, kind)
  select pt.club_id, pt.player_id, t.id, t.name, 'secundari'
  from public.player_teams pt join public.teams t on t.id = pt.team_id
  where not exists (
    select 1 from public.player_team_history h
    where h.player_id = pt.player_id and h.team_id = pt.team_id and h.kind = 'secundari'
  );

create or replace function public.guardian_assessment_summary(p_player_id uuid)
returns table (created_at timestamptz, avg_score numeric)
language sql stable security definer set search_path = public as $$
  select a.created_at, (a.tec + a.fis + a.tac + a.men)::numeric / 4
  from assessments a
  where a.player_id = p_player_id and public.is_guardian_of(p_player_id)
  order by a.created_at
$$;

grant execute on function public.guardian_assessment_summary(uuid) to authenticated;
