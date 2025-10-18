-- Extensions
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- Tables
create table if not exists public.barbers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  name text not null,
  description text,
  location text,
  price_range text check (price_range in ('€','€€','€€€')),
  image_url text,
  rating numeric(2,1),
  created_at timestamptz not null default now()
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  barber_id uuid not null references public.barbers(id) on delete cascade,
  name text not null,
  price numeric(10,2) not null check (price >= 0)
);

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  favorites uuid[]
);

-- Indexes
create index if not exists idx_barbers_owner on public.barbers(owner_id);
create index if not exists idx_services_barber on public.services(barber_id);
create index if not exists idx_barbers_location on public.barbers(location);

-- RLS
alter table public.barbers enable row level security;
alter table public.services enable row level security;
alter table public.users enable row level security;

-- Policies
drop policy if exists "Barbers select for all" on public.barbers;
create policy "Barbers select for all" on public.barbers for select to anon, authenticated using (true);

drop policy if exists "Barbers insert by owner" on public.barbers;
create policy "Barbers insert by owner" on public.barbers for insert to authenticated with check (owner_id = auth.uid());

drop policy if exists "Barbers update by owner" on public.barbers;
create policy "Barbers update by owner" on public.barbers for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists "Barbers delete by owner" on public.barbers;
create policy "Barbers delete by owner" on public.barbers for delete to authenticated using (owner_id = auth.uid());

drop policy if exists "Services select for all" on public.services;
create policy "Services select for all" on public.services for select to anon, authenticated using (true);

drop policy if exists "Services write by owner" on public.services;
create policy "Services write by owner" on public.services for all to authenticated
using (exists (
  select 1 from public.barbers b where b.id = services.barber_id and b.owner_id = auth.uid()
))
with check (exists (
  select 1 from public.barbers b where b.id = services.barber_id and b.owner_id = auth.uid()
));

drop policy if exists "Users self read" on public.users;
create policy "Users self read" on public.users for select to authenticated using (id = auth.uid());

drop policy if exists "Users self upsert" on public.users;
create policy "Users self upsert" on public.users for insert to authenticated with check (id = auth.uid());

drop policy if exists "Users self update" on public.users;
create policy "Users self update" on public.users for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- Seed using first existing auth user (if present)
with u as (
  select id, email from auth.users order by created_at asc limit 1
)
insert into public.barbers (owner_id, name, description, location, price_range, image_url, rating)
select u.id, x.name, x.description, x.location, x.price_range, x.image_url, x.rating
from u
join (values
  ('Studio Sharp','Moderne kapsalon in centrum','Amsterdam','€€','https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=1200&auto=format&fit=crop',4.8),
  ('Kapper Noord','Gezellig en betaalbaar','Rotterdam','€','https://images.unsplash.com/photo-1593702288056-7927b442542d?q=80&w=1200&auto=format&fit=crop',4.5),
  ('Fade Factory','Specialist in fades','Utrecht','€€€','https://images.unsplash.com/photo-1621605815971-fbc98d7a2115?q=80&w=1200&auto=format&fit=crop',4.9)
) as x(name, description, location, price_range, image_url, rating) on true
on conflict do nothing;

insert into public.services (barber_id, name, price)
select b.id, s.name, s.price
from public.barbers b
join (values ('Knippen',25.00), ('Baard',15.00), ('Wassen & knippen',35.00)) s(name, price) on true
on conflict do nothing;

insert into public.users (id, email, favorites)
select u.id, u.email, (select array(select id from public.barbers limit 2))
from (select id, email from auth.users order by created_at asc limit 1) u
on conflict (id) do nothing;



