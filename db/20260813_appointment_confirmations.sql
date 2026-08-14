-- Vicino Connect: confirmación de citas por el paciente.
-- Ejecutar una sola vez después de 20260813_professional_agenda.sql.

alter table public.appointments
  drop constraint if exists appointments_status_check;

alter table public.appointments
  add constraint appointments_status_check
  check (status in ('pending_patient','confirmed','scheduled','postponed','cancelled','completed'));

alter table public.appointments
  add column if not exists confirmed_at timestamptz;

drop policy if exists "patients confirm own appointments" on public.appointments;
create policy "patients confirm own appointments"
on public.appointments for update
using (patient_id = auth.uid() and status = 'pending_patient')
with check (patient_id = auth.uid() and status = 'confirmed');

grant select, update on public.appointments to authenticated;
notify pgrst, 'reload schema';
