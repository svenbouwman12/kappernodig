-- Create clients table
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.barbers(id) on delete cascade,
  naam text not null,
  telefoon text not null,
  email text,
  laatste_afspraak timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Add indexes for better performance
create index if not exists idx_clients_salon_id on public.clients(salon_id);
create index if not exists idx_clients_naam on public.clients(naam);
create index if not exists idx_clients_telefoon on public.clients(telefoon);
create index if not exists idx_clients_email on public.clients(email);
create index if not exists idx_clients_laatste_afspraak on public.clients(laatste_afspraak);

-- Enable RLS
alter table public.clients enable row level security;

-- RLS Policies
drop policy if exists "Clients select by salon owner" on public.clients;
create policy "Clients select by salon owner" on public.clients 
  for select to authenticated using (
    exists (
      select 1 from public.barbers 
      where barbers.id = clients.salon_id 
      and barbers.owner_id = auth.uid()
    )
  );

drop policy if exists "Clients insert by salon owner" on public.clients;
create policy "Clients insert by salon owner" on public.clients 
  for insert to authenticated with check (
    exists (
      select 1 from public.barbers 
      where barbers.id = clients.salon_id 
      and barbers.owner_id = auth.uid()
    )
  );

drop policy if exists "Clients update by salon owner" on public.clients;
create policy "Clients update by salon owner" on public.clients 
  for update to authenticated using (
    exists (
      select 1 from public.barbers 
      where barbers.id = clients.salon_id 
      and barbers.owner_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.barbers 
      where barbers.id = clients.salon_id 
      and barbers.owner_id = auth.uid()
    )
  );

drop policy if exists "Clients delete by salon owner" on public.clients;
create policy "Clients delete by salon owner" on public.clients 
  for delete to authenticated using (
    exists (
      select 1 from public.barbers 
      where barbers.id = clients.salon_id 
      and barbers.owner_id = auth.uid()
    )
  );

-- Function to automatically update updated_at timestamp
create or replace function update_clients_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger to automatically update updated_at
create trigger update_clients_updated_at
  before update on public.clients
  for each row
  execute function update_clients_updated_at();
