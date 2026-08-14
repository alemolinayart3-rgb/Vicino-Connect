-- Vicino Connect: agenda persistente para profesionales y pacientes.
-- Ejecutar una sola vez en Supabase > SQL Editor.

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.care_assignments(id) on delete cascade,
  patient_id uuid not null references public.profiles(id),
  professional_id uuid not null references public.profiles(id),
  starts_at timestamptz not null,
  duration_minutes integer not null default 50 check (duration_minutes between 15 and 240),
  status text not null default 'scheduled' check (status in ('scheduled','postponed','cancelled','completed')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists appointments_professional_date on public.appointments(professional_id,starts_at);
create index if not exists appointments_patient_date on public.appointments(patient_id,starts_at);
alter table public.appointments enable row level security;

drop policy if exists "professionals manage own appointments" on public.appointments;
create policy "professionals manage own appointments" on public.appointments for all
 using(professional_id=auth.uid() and exists(select 1 from public.care_assignments a where a.id=assignment_id and a.professional_id=auth.uid() and a.status='active'))
 with check(professional_id=auth.uid() and exists(select 1 from public.care_assignments a where a.id=assignment_id and a.patient_id=patient_id and a.professional_id=auth.uid() and a.status='active'));

drop policy if exists "patients read own appointments" on public.appointments;
create policy "patients read own appointments" on public.appointments for select using(patient_id=auth.uid());

grant select,insert,update,delete on public.appointments to authenticated;
notify pgrst, 'reload schema';
