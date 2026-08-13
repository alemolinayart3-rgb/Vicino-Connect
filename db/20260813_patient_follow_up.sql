-- Recursos de seguimiento asignados por el profesional.
create type public.care_item_kind as enum ('private_note','activity','check_in');
create type public.care_item_frequency as enum ('once','daily','weekly');
create table public.care_plan_items(
 id uuid primary key default gen_random_uuid(), assignment_id uuid not null references public.care_assignments(id) on delete cascade,
 created_by uuid not null references public.profiles(id), kind public.care_item_kind not null,
 title text not null, instructions text, frequency public.care_item_frequency not null default 'once',
 active boolean not null default true, created_at timestamptz not null default now()
);
alter table public.care_plan_items enable row level security;
create policy "assigned professional manages follow up" on public.care_plan_items for all
 using(exists(select 1 from public.care_assignments a where a.id=assignment_id and a.professional_id=auth.uid() and a.status='active'))
 with check(created_by=auth.uid() and exists(select 1 from public.care_assignments a where a.id=assignment_id and a.professional_id=auth.uid() and a.status='active'));
create policy "patient reads shared follow up" on public.care_plan_items for select
 using(kind<>'private_note' and exists(select 1 from public.care_assignments a where a.id=assignment_id and a.patient_id=auth.uid() and a.status='active'));
