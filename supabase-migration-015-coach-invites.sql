-- ============================================================
-- PLAY360 · Migració 015 — triar o convidar l'entrenador d'un equip
--
-- 1) club_coaches: llista d'entrenadors del club (nom + correu) per
--    al desplegable. El correu viu a auth.users, que l'app no pot
--    llegir, per això és una funció security definer, limitada a
--    admin i coordinadors del club.
-- 2) assign_team_coach: vincula un entrenador existent a l'equip
--    (team_staff) — això és el que fa que l'equip li surti a la
--    seva Visió 360, Entrenaments, Partits...
-- 3) invite_team_coach: si el correu ja té compte, el vincula al
--    moment; si no, deixa una invitació pendent a staff_invites.
-- 4) Trigger a auth.users: quan algú amb una invitació pendent
--    entra per primer cop, se li crea la membership d'entrenador i
--    el vincle a l'equip automàticament.
--
-- Cap funció deixa actuar fora de l'abast del qui la crida: admin
-- del club o coordinador de la secció (esport) de l'equip.
--
-- Executa aquest fitxer sencer a: Supabase → SQL Editor → Run
-- ============================================================

create table if not exists public.staff_invites (
  id          uuid primary key default gen_random_uuid(),
  club_id     uuid not null references public.clubs(id) on delete cascade,
  team_id     uuid not null references public.teams(id) on delete cascade,
  email       text not null,
  full_name   text,
  invited_by  uuid references auth.users(id),
  created_at  timestamptz not null default now(),
  accepted_at timestamptz
);
create index if not exists staff_invites_email_idx on public.staff_invites (lower(email)) where accepted_at is null;

alter table public.staff_invites enable row level security;

drop policy if exists staff_invites_select on public.staff_invites;
create policy staff_invites_select on public.staff_invites
  for select using (
    public.has_role(staff_invites.club_id, array['admin'])
    or exists (
      select 1 from teams t
      where t.id = staff_invites.team_id and public.coordinates_sport(staff_invites.club_id, t.sport)
    )
  );

-- Comprova que qui crida pot gestionar l'equip; retorna l'equip.
create or replace function public.assert_can_manage_team(p_team_id uuid)
returns public.teams
language plpgsql stable security definer set search_path = public as $$
declare
  v_team teams;
begin
  select * into v_team from teams where id = p_team_id;
  if v_team.id is null then
    raise exception 'Equip no trobat';
  end if;
  if not (public.has_role(v_team.club_id, array['admin']) or public.coordinates_sport(v_team.club_id, v_team.sport)) then
    raise exception 'No autoritzat per gestionar aquest equip';
  end if;
  return v_team;
end $$;

create or replace function public.club_coaches(p_club_id uuid)
returns table (user_id uuid, full_name text, email text, section text)
language sql stable security definer set search_path = public as $$
  select m.user_id, p.full_name, u.email::text, m.section
  from memberships m
  join auth.users u on u.id = m.user_id
  left join profiles p on p.id = m.user_id
  where m.club_id = p_club_id
    and m.role = 'entrenador'
    and public.has_role(p_club_id, array['admin','coordinador'])
  order by coalesce(p.full_name, u.email)
$$;

create or replace function public.link_coach_to_team(v_team public.teams, p_user_id uuid, p_full_name text)
returns void
language plpgsql security definer set search_path = public as $$
begin
  insert into memberships (club_id, user_id, role, section)
    values (v_team.club_id, p_user_id, 'entrenador', v_team.sport)
    on conflict (club_id, user_id, role) do nothing;

  insert into team_staff (team_id, user_id) values (v_team.id, p_user_id)
    on conflict (team_id, user_id) do nothing;

  if p_full_name is not null then
    update profiles set full_name = p_full_name where id = p_user_id and full_name is null;
  end if;

  update teams
    set coach_name = coalesce(
      (select full_name from profiles where id = p_user_id),
      p_full_name,
      (select email from auth.users where id = p_user_id)
    )
    where id = v_team.id;
end $$;

-- Només s'ha de poder cridar des de les altres funcions, no des de l'app.
revoke execute on function public.link_coach_to_team(public.teams, uuid, text) from public, anon, authenticated;

create or replace function public.assign_team_coach(p_team_id uuid, p_user_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_team teams := public.assert_can_manage_team(p_team_id);
begin
  if not exists (
    select 1 from memberships where club_id = v_team.club_id and user_id = p_user_id and role = 'entrenador'
  ) then
    raise exception 'Aquesta persona no és entrenadora del club';
  end if;
  perform public.link_coach_to_team(v_team, p_user_id, null);
end $$;

-- Retorna 'linked' si el correu ja tenia compte (vinculat al moment)
-- o 'pending' si queda pendent fins que entri per primer cop.
create or replace function public.invite_team_coach(p_team_id uuid, p_email text, p_full_name text)
returns text
language plpgsql security definer set search_path = public as $$
declare
  v_team teams := public.assert_can_manage_team(p_team_id);
  v_email text := lower(trim(p_email));
  v_name text := nullif(trim(p_full_name), '');
  v_user_id uuid;
begin
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'Correu no vàlid';
  end if;

  select id into v_user_id from auth.users where lower(email) = v_email;

  if v_user_id is not null then
    perform public.link_coach_to_team(v_team, v_user_id, v_name);
    return 'linked';
  end if;

  insert into staff_invites (club_id, team_id, email, full_name, invited_by)
    values (v_team.club_id, v_team.id, v_email, v_name, auth.uid());
  update teams set coach_name = coalesce(v_name, v_email) where id = v_team.id;
  return 'pending';
end $$;

grant execute on function public.club_coaches(uuid) to authenticated;
grant execute on function public.assign_team_coach(uuid, uuid) to authenticated;
grant execute on function public.invite_team_coach(uuid, text, text) to authenticated;

-- Es diu "on_auth_user_invites" perquè els triggers s'executen per
-- ordre alfabètic: així corre després de on_auth_user_created, que és
-- qui crea el profile. Qualsevol error s'ignora (amb un warning): mai
-- ha de poder bloquejar que algú es registri.
create or replace function public.accept_staff_invites()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  inv record;
  v_team teams;
begin
  begin
    for inv in
      select * from staff_invites where lower(email) = lower(new.email) and accepted_at is null
    loop
      select * into v_team from teams where id = inv.team_id;
      if v_team.id is not null then
        perform public.link_coach_to_team(v_team, new.id, inv.full_name);
      end if;
      update staff_invites set accepted_at = now() where id = inv.id;
    end loop;
  exception when others then
    raise warning 'accept_staff_invites: %', sqlerrm;
  end;
  return new;
end $$;

drop trigger if exists on_auth_user_invites on auth.users;
create trigger on_auth_user_invites
  after insert on auth.users
  for each row execute function public.accept_staff_invites();
