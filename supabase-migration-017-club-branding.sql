-- ============================================================
-- PLAY360 · Migració 017 — marca del club (logo + color) i pla
--
-- clubs.logo_url / primary_color: la direcció del club els tria a
-- Configuració; l'app els aplica al tauler i als correus.
-- clubs.plan ja existeix des de la Setmana 1 (pilot/starter/club/elit):
-- es mostra a Llicències i només el canvia Planter, per SQL.
--
-- També corregeix les migracions 015 i 016: handle_new_user posa el
-- correu com a full_name quan algú es registra, així que el nom que
-- escrivia el coordinador en convidar no es desava mai.
--
-- Logos al bucket públic "club-logos", dins una carpeta per club
-- (<club_id>/...). Només la direcció d'aquell club hi pot pujar o
-- esborrar. Sense SVG: pot portar scripts i els clients de correu
-- no el mostren.
--
-- Executa aquest fitxer sencer a: Supabase → SQL Editor → Run
-- ============================================================

alter table public.clubs
  add column if not exists logo_url text,
  add column if not exists primary_color text;

alter table public.clubs drop constraint if exists clubs_primary_color_check;
alter table public.clubs
  add constraint clubs_primary_color_check check (primary_color is null or primary_color ~ '^#[0-9a-fA-F]{6}$');

-- La direcció només pot tocar logo i color, no el nom ni el pla.
create or replace function public.update_club_branding(p_club_id uuid, p_logo_url text, p_primary_color text)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.has_role(p_club_id, array['admin']) then
    raise exception 'Només la direcció del club pot canviar-ne la marca';
  end if;
  update clubs
    set logo_url = nullif(trim(p_logo_url), ''),
        primary_color = nullif(trim(p_primary_color), '')
    where id = p_club_id;
end $$;

grant execute on function public.update_club_branding(uuid, text, text) to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values ('club-logos', 'club-logos', true, 1048576, array['image/png', 'image/jpeg', 'image/webp'])
  on conflict (id) do update
    set public = true, file_size_limit = 1048576, allowed_mime_types = array['image/png', 'image/jpeg', 'image/webp'];

drop policy if exists club_logos_insert on storage.objects;
create policy club_logos_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'club-logos'
    and public.has_role(((storage.foldername(name))[1])::uuid, array['admin'])
  );

drop policy if exists club_logos_update on storage.objects;
create policy club_logos_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'club-logos'
    and public.has_role(((storage.foldername(name))[1])::uuid, array['admin'])
  );

drop policy if exists club_logos_delete on storage.objects;
create policy club_logos_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'club-logos'
    and public.has_role(((storage.foldername(name))[1])::uuid, array['admin'])
  );

-- Recompte per a Llicències: usuaris amb accés al club (per rol). El
-- recompte de memberships d'altres usuaris no és visible per RLS.
create or replace function public.club_usage(p_club_id uuid)
returns table (role text, total bigint)
language sql stable security definer set search_path = public as $$
  select m.role, count(*)
  from memberships m
  where m.club_id = p_club_id and public.has_role(p_club_id, array['admin'])
  group by m.role
$$;

grant execute on function public.club_usage(uuid) to authenticated;

-- ---- Correccions de nom (migracions 015 i 016) ----

-- Un full_name igual al correu és el valor per defecte de
-- handle_new_user, no un nom real: es pot substituir.
create or replace function public.set_name_if_default(p_user_id uuid, p_full_name text)
returns void
language sql security definer set search_path = public as $$
  update profiles p
    set full_name = p_full_name
    where p.id = p_user_id
      and p_full_name is not null
      and (p.full_name is null or p.full_name = (select u.email from auth.users u where u.id = p_user_id));
$$;
revoke execute on function public.set_name_if_default(uuid, text) from public, anon, authenticated;

create or replace function public.link_coach_to_team(v_team public.teams, p_user_id uuid, p_full_name text)
returns void
language plpgsql security definer set search_path = public as $$
begin
  insert into memberships (club_id, user_id, role, section)
    values (v_team.club_id, p_user_id, 'entrenador', v_team.sport)
    on conflict (club_id, user_id, role) do nothing;

  insert into team_staff (team_id, user_id) values (v_team.id, p_user_id)
    on conflict (team_id, user_id) do nothing;

  perform public.set_name_if_default(p_user_id, p_full_name);

  update teams
    set coach_name = coalesce(
      nullif((select full_name from profiles where id = p_user_id), (select email from auth.users where id = p_user_id)),
      p_full_name,
      (select email from auth.users where id = p_user_id)
    )
    where id = v_team.id;
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

  perform public.set_name_if_default(p_user_id, p_full_name);
end $$;

-- Si el nom és només el correu, es retorna null perquè l'app no el
-- mostri dues vegades.
create or replace function public.club_coaches(p_club_id uuid)
returns table (user_id uuid, full_name text, email text, section text)
language sql stable security definer set search_path = public as $$
  select m.user_id, nullif(p.full_name, u.email::text), u.email::text, m.section
  from memberships m
  join auth.users u on u.id = m.user_id
  left join profiles p on p.id = m.user_id
  where m.club_id = p_club_id
    and m.role = 'entrenador'
    and public.has_role(p_club_id, array['admin','coordinador'])
  order by coalesce(nullif(p.full_name, u.email::text), u.email::text)
$$;

create or replace function public.player_guardians(p_player_id uuid)
returns table (full_name text, email text, pending boolean)
language plpgsql stable security definer set search_path = public as $$
declare
  v_player players := public.assert_can_manage_player(p_player_id);
begin
  return query
    select nullif(p.full_name, u.email::text), u.email::text, false
    from guardians g
    join auth.users u on u.id = g.user_id
    left join profiles p on p.id = g.user_id
    where g.player_id = v_player.id
    union all
    select i.full_name, i.email, true
    from guardian_invites i
    where i.player_id = v_player.id and i.accepted_at is null;
end $$;
