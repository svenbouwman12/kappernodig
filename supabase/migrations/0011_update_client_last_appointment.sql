-- Function to update client's last appointment date
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

-- Trigger to automatically update client's last appointment when appointment is created/updated
create trigger update_client_last_appointment_trigger
  after insert or update on public.appointments
  for each row
  execute function update_client_last_appointment();
