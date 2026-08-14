-- Vicino Connect: recursos, encuestas y documentación asignada.
-- Ejecutar una sola vez en Supabase > SQL Editor.

do $$ begin
  create type public.care_item_kind as enum ('private_note','activity','check_in');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.care_item_frequency as enum ('once','daily','weekly');
exception when duplicate_object then null;
end $$;

create table if not exists public.care_plan_items (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.care_assignments(id) on delete cascade,
  created_by uuid not null references public.profiles(id),
  kind public.care_item_kind not null,
  resource_type text not null default 'activity'
    check (resource_type in ('activity','check_in','questionnaire','educational_material','medical_indication','treatment_review')),
  title text not null,
  instructions text,
  content jsonb not null default '{}'::jsonb,
  frequency public.care_item_frequency not null default 'once',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.care_plan_items add column if not exists resource_type text not null default 'activity';
alter table public.care_plan_items add column if not exists content jsonb not null default '{}'::jsonb;
alter table public.care_plan_items enable row level security;

drop policy if exists "assigned professional manages follow up" on public.care_plan_items;
create policy "assigned professional manages follow up" on public.care_plan_items for all
 using(exists(select 1 from public.care_assignments a where a.id=assignment_id and a.professional_id=auth.uid() and a.status='active'))
 with check(created_by=auth.uid() and exists(select 1 from public.care_assignments a where a.id=assignment_id and a.professional_id=auth.uid() and a.status='active'));

drop policy if exists "patient reads shared follow up" on public.care_plan_items;
create policy "patient reads shared follow up" on public.care_plan_items for select
 using(kind<>'private_note' and exists(select 1 from public.care_assignments a where a.id=assignment_id and a.patient_id=auth.uid() and a.status='active'));

grant select,insert,update,delete on public.care_plan_items to authenticated;
notify pgrst, 'reload schema';
