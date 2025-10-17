-- Create separate table for kapper accounts
create table if not exists public.kapper_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  phone text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Add unique constraint for user_id to ensure one kapper account per user
alter table public.kapper_accounts add constraint unique_kapper_user_id unique (user_id);

-- Add indexes for better performance
create index if not exists idx_kapper_accounts_user_id on public.kapper_accounts(user_id);
create index if not exists idx_kapper_accounts_email on public.kapper_accounts(email);
create index if not exists idx_kapper_accounts_created_at on public.kapper_accounts(created_at);

-- Enable RLS
alter table public.kapper_accounts enable row level security;

-- RLS Policies
drop policy if exists "Kapper accounts select own" on public.kapper_accounts;
create policy "Kapper accounts select own" on public.kapper_accounts 
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "Kapper accounts insert own" on public.kapper_accounts;
create policy "Kapper accounts insert own" on public.kapper_accounts 
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "Kapper accounts update own" on public.kapper_accounts;
create policy "Kapper accounts update own" on public.kapper_accounts 
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "Kapper accounts delete own" on public.kapper_accounts;
create policy "Kapper accounts delete own" on public.kapper_accounts 
  for delete to authenticated using (user_id = auth.uid());

-- Function to automatically update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger to automatically update updated_at
create trigger update_kapper_accounts_updated_at
  before update on public.kapper_accounts
  for each row
  execute function update_updated_at_column();
