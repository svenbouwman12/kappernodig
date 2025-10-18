-- Add foreign key constraint to appointments table after clients table exists
alter table public.appointments 
add constraint fk_appointments_klant_id 
foreign key (klant_id) references public.clients(id) on delete cascade;
