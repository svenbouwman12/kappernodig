alter table public.barbers
  add column if not exists latitude double precision,
  add column if not exists longitude double precision;

create index if not exists idx_barbers_latlng on public.barbers(latitude, longitude);


