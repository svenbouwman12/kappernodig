-- Complete agenda and clients system migration
-- This creates all necessary tables, indexes, policies, and triggers in the correct order

-- 1. Create clients table first (appointments needs to reference it)
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

-- 2. Create appointments table
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.barbers(id) on delete cascade,
  klant_id uuid not null references public.clients(id) on delete cascade,
  dienst text not null,
  start_tijd timestamptz not null,
  eind_tijd timestamptz not null,
  notities text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Add indexes for better performance
create index if not exists idx_clients_salon_id on public.clients(salon_id);
create index if not exists idx_clients_naam on public.clients(naam);
create index if not exists idx_clients_telefoon on public.clients(telefoon);
create index if not exists idx_clients_email on public.clients(email);
create index if not exists idx_clients_laatste_afspraak on public.clients(laatste_afspraak);

create index if not exists idx_appointments_salon_id on public.appointments(salon_id);
create index if not exists idx_appointments_klant_id on public.appointments(klant_id);
create index if not exists idx_appointments_start_tijd on public.appointments(start_tijd);

-- 4. Enable RLS on both tables
alter table public.clients enable row level security;
alter table public.appointments enable row level security;

-- 5. RLS Policies for clients
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

-- 6. RLS Policies for appointments
drop policy if exists "Appointments select by salon owner" on public.appointments;
create policy "Appointments select by salon owner" on public.appointments 
  for select to authenticated using (
    exists (
      select 1 from public.barbers 
      where barbers.id = appointments.salon_id 
      and barbers.owner_id = auth.uid()
    )
  );

drop policy if exists "Appointments insert by salon owner" on public.appointments;
create policy "Appointments insert by salon owner" on public.appointments 
  for insert to authenticated with check (
    exists (
      select 1 from public.barbers 
      where barbers.id = appointments.salon_id 
      and barbers.owner_id = auth.uid()
    )
  );

drop policy if exists "Appointments update by salon owner" on public.appointments;
create policy "Appointments update by salon owner" on public.appointments 
  for update to authenticated using (
    exists (
      select 1 from public.barbers 
      where barbers.id = appointments.salon_id 
      and barbers.owner_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.barbers 
      where barbers.id = appointments.salon_id 
      and barbers.owner_id = auth.uid()
    )
  );

drop policy if exists "Appointments delete by salon owner" on public.appointments;
create policy "Appointments delete by salon owner" on public.appointments 
  for delete to authenticated using (
    exists (
      select 1 from public.barbers 
      where barbers.id = appointments.salon_id 
      and barbers.owner_id = auth.uid()
    )
  );

-- 7. Functions for automatic timestamp updates
create or replace function update_clients_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace function update_appointments_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace function update_client_last_appointment()
returns trigger as $$
begin
  -- Update the client's last appointment date
  update public.clients 
  set laatste_afspraak = new.start_tijd
  where id = new.klant_id;
  
  return new;
end;
$$ language plpgsql;

-- 8. Triggers for automatic timestamp updates (only if they don't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_clients_updated_at'
    ) THEN
        CREATE TRIGGER update_clients_updated_at
          BEFORE UPDATE ON public.clients
          FOR EACH ROW
          EXECUTE FUNCTION update_clients_updated_at();
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_appointments_updated_at'
    ) THEN
        CREATE TRIGGER update_appointments_updated_at
          BEFORE UPDATE ON public.appointments
          FOR EACH ROW
          EXECUTE FUNCTION update_appointments_updated_at();
    END IF;
END $$;

-- 9. Trigger to automatically update client's last appointment (only if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_client_last_appointment_trigger'
    ) THEN
        CREATE TRIGGER update_client_last_appointment_trigger
          AFTER INSERT OR UPDATE ON public.appointments
          FOR EACH ROW
          EXECUTE FUNCTION update_client_last_appointment();
    END IF;
END $$;
