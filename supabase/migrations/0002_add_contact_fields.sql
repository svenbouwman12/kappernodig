-- Extend barbers with contact/details fields
alter table public.barbers
  add column if not exists address text,
  add column if not exists phone text,
  add column if not exists website text;

-- Optional: backfill demo data for existing rows (safe no-op if none)
update public.barbers
set address = coalesce(address, 'Damrak 1, 1012 LG Amsterdam'),
    phone = coalesce(phone, '+31 20 123 4567'),
    website = coalesce(website, 'https://example.com')
where address is null or phone is null or website is null;


