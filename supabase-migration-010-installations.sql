-- ============================================================
-- PLAY360 · Migració 010 — llistat d'instal·lacions del club
--
-- Entitat compartida entre Entrenaments i Partits: substitueix el
-- text lliure de "lloc" per un desplegable, i l'adreça permet
-- obrir Google Maps directament.
--
-- Lectura: qualsevol membre del club (calen els noms/adreces per
-- mostrar els desplegables i els enllaços de Maps a qualsevol rol).
-- Escriptura: admin i coordinador únicament.
--
-- Executa aquest fitxer sencer a: Supabase → SQL Editor → Run
-- ============================================================

create table public.installations (
  id         uuid primary key default gen_random_uuid(),
  club_id    uuid not null references public.clubs(id) on delete cascade,
  name       text not null,
  address    text,
  created_at timestamptz not null default now()
);
create index on public.installations (club_id);

alter table public.installations enable row level security;

create policy installations_select on public.installations
  for select using (public.is_member(club_id));

create policy installations_write on public.installations
  for all using (public.has_role(club_id, array['admin','coordinador']));
