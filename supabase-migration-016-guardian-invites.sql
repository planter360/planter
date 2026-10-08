-- ============================================================
-- PLAY360 · Migració 016 — vincular famílies als jugadors
--
-- Mateix patró que els entrenadors (migració 015, que cal haver
-- executat abans): des de la fitxa del jugador, el cos tècnic
-- afegeix el correu d'un familiar.
--   - Si ja té compte: es crea la membership 'familia' i la fila a
--     guardians al moment.
--   - Si no: queda a guardian_invites i el trigger d'auth.users ho
--     activa quan entra per primer cop.
-- guardians és la taula de la Setmana 1 que fa servir
-- is_guardian_of(): un cop hi ha la fila, la família ja veu rebuts,
-- partits, entrenaments i comunicats del seu fill.
--
-- Pot gestionar-ho: admin del club, coordinador de la secció de
-- l'equip del jugador o entrenador de l'equip.
--
-- Executa aquest fitxer sencer a: Supabase → SQL Editor → Run
-- ============================================================

create table if not exists public.guardian_invites (
  id          uuid primary key default gen_random_uuid(),
  club_id     uuid not null references public.clubs(id) on delete cascade,
  player_id   uuid not null references public.players(id) on delete cascade,
  email       text not null,
  full_name   text,
  invited_by  uuid references auth.users(id),
  created_at  timestamptz not null default now(),
  accepted_at timestamptz
);
create index if not exists guardian_invites_email_idx on public.guardian_invites (lower(email)) where accepted_at is null;

-- Sense polítiques: només s'hi accedeix a través de les funcions.
alter table public.guardian_invites enable row level security;

create or replace function public.assert_can_manage_player(p_player_id uuid)
returns public.players
language plpgsql stable security definer set search_path = public as $$
declare
  v_player players;
  v_sport text;
begin
  select * into v_player from players where id = p_player_id;
  if v_player.id is null then
    raise exception 'Jugador no trobat';
  end if;
  select sport into v_sport from teams where id = v_player.team_id;
  if not (
    public.has_role(v_player.club_id, array['admin'])
    or (v_sport is not null and public.coordinates_sport(v_player.club_id, v_sport))
    or public.manages_team(v_player.team_id)
  ) then
    raise exception 'No autoritzat per gestionar aquest jugador';
  end if;
  return v_player;
end $$;

create or replace function public.link_guardian(v_player public.players, p_user_id uuid, p_full_name text)
returns void
language plpgsql security definer set search_path = public as $$
begin
  insert into memberships (club_id, user_id, role, section)
    values (v_player.club_id, p_user_id, 'familia', null)
    on conflict (club_id, user_id, role) do nothing;

  insert into guardians (user_id, player_id) values (p_user_id, v_player.id)
    on conflict (user_id, player_id) do nothing;

  if p_full_name is not null then
    update profiles set full_name = p_full_name where id = p_user_id and full_name is null;
  end if;
end $$;

revoke execute on function public.link_guardian(public.players, uuid, text) from public, anon, authenticated;

-- 'linked' si el correu ja tenia compte, 'pending' si no.
create or replace function public.invite_guardian(p_player_id uuid, p_email text, p_full_name text)
returns text
language plpgsql security definer set search_path = public as $$
declare
  v_player players := public.assert_can_manage_player(p_player_id);
  v_email text := lower(trim(p_email));
  v_name text := nullif(trim(p_full_name), '');
  v_user_id uuid;
begin
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'Correu no vàlid';
  end if;

  select id into v_user_id from auth.users where lower(email) = v_email;
  if v_user_id is not null then
    perform public.link_guardian(v_player, v_user_id, v_name);
    return 'linked';
  end if;

  if not exists (
    select 1 from guardian_invites
    where player_id = v_player.id and lower(email) = v_email and accepted_at is null
  ) then
    insert into guardian_invites (club_id, player_id, email, full_name, invited_by)
      values (v_player.club_id, v_player.id, v_email, v_name, auth.uid());
  end if;
  return 'pending';
end $$;

-- Familiars vinculats i invitacions pendents d'un jugador.
create or replace function public.player_guardians(p_player_id uuid)
returns table (full_name text, email text, pending boolean)
language plpgsql stable security definer set search_path = public as $$
declare
  v_player players := public.assert_can_manage_player(p_player_id);
begin
  return query
    select p.full_name, u.email::text, false
    from guardians g
    join auth.users u on u.id = g.user_id
    left join profiles p on p.id = g.user_id
    where g.player_id = v_player.id
    union all
    select i.full_name, i.email, true
    from guardian_invites i
    where i.player_id = v_player.id and i.accepted_at is null;
end $$;

-- Treu el vincle (o la invitació pendent) d'aquest correu amb el
-- jugador. No esborra la membership: pot tenir altres fills al club.
create or replace function public.remove_guardian(p_player_id uuid, p_email text)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_player players := public.assert_can_manage_player(p_player_id);
  v_email text := lower(trim(p_email));
begin
  delete from guardians g
    using auth.users u
    where g.user_id = u.id and g.player_id = v_player.id and lower(u.email) = v_email;
  delete from guardian_invites
    where player_id = v_player.id and lower(email) = v_email and accepted_at is null;
end $$;

grant execute on function public.invite_guardian(uuid, text, text) to authenticated;
grant execute on function public.player_guardians(uuid) to authenticated;
grant execute on function public.remove_guardian(uuid, text) to authenticated;

-- Substitueix la funció del trigger de la migració 015 perquè també
-- activi les invitacions de família. El trigger ja existeix.
create or replace function public.accept_staff_invites()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  inv record;
  v_team teams;
  v_player players;
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

    for inv in
      select * from guardian_invites where lower(email) = lower(new.email) and accepted_at is null
    loop
      select * into v_player from players where id = inv.player_id;
      if v_player.id is not null then
        perform public.link_guardian(v_player, new.id, inv.full_name);
      end if;
      update guardian_invites set accepted_at = now() where id = inv.id;
    end loop;
  exception when others then
    raise warning 'accept_staff_invites: %', sqlerrm;
  end;
  return new;
end $$;
