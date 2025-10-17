-- Create appointments table (clients table must exist first)
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.barbers(id) on delete cascade,
  klant_id uuid not null, -- Will add foreign key constraint after clients table is created
  dienst text not null,
  start_tijd timestamptz not null,
  eind_tijd timestamptz not null,
  notities text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Add indexes for better performance
create index if not exists idx_appointments_salon_id on public.appointments(salon_id);
create index if not exists idx_appointments_klant_id on public.appointments(klant_id);
create index if not exists idx_appointments_start_tijd on public.appointments(start_tijd);

-- Enable RLS
alter table public.appointments enable row level security;

-- RLS Policies
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

-- Function to automatically update updated_at timestamp
create or replace function update_appointments_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger to automatically update updated_at
create trigger update_appointments_updated_at
  before update on public.appointments
  for each row
  execute function update_appointments_updated_at();
