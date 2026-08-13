-- Vicino Connect: organizaciones, equipos de cuidado y administración master.
-- Ejecutar una sola vez en el SQL Editor de Supabase.

create type public.organization_status as enum ('active', 'suspended', 'cancelled');
create type public.membership_status as enum ('active', 'suspended', 'ended');
create type public.assignment_status as enum ('pending', 'active', 'suspended', 'ended');

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null references public.profiles(id),
  status public.organization_status not null default 'active',
  inactivity_days integer not null default 90 check (inactivity_days between 30 and 365),
  suspended_at timestamptz,
  suspension_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organization_memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id),
  role public.user_role not null,
  status public.membership_status not null default 'active',
  joined_at timestamptz not null default now(),
  ended_at timestamptz,
  unique (organization_id, user_id)
);

create table public.care_assignments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  patient_id uuid not null references public.profiles(id),
  professional_id uuid not null references public.profiles(id),
  professional_role public.user_role not null check (professional_role in ('psicologo', 'psiquiatra')),
  status public.assignment_status not null default 'pending',
  starts_at timestamptz,
  ends_at timestamptz,
  last_activity_at timestamptz not null default now(),
  ended_reason text,
  replaced_by uuid references public.care_assignments(id),
  created_at timestamptz not null default now(),
  check (patient_id <> professional_id)
);

create unique index one_active_professional_per_role
  on public.care_assignments (organization_id, patient_id, professional_role)
  where status in ('pending', 'active');

create index care_assignments_patient on public.care_assignments(patient_id, status);
create index care_assignments_professional on public.care_assignments(professional_id, status);

-- El rol master vive en app_metadata de Auth, no en el perfil clínico.
create or replace function public.is_vicino_master()
returns boolean language sql stable security definer set search_path = public
as $$ select coalesce((auth.jwt() -> 'app_metadata' ->> 'vicino_master')::boolean, false); $$;

create or replace function public.is_organization_owner(org_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select exists(select 1 from public.organizations where id = org_id and owner_id = auth.uid()); $$;

create or replace function public.assignment_is_current(a public.care_assignments)
returns boolean language sql stable
as $$
  select a.status = 'active'
    and a.last_activity_at >= now() - (
      select make_interval(days => inactivity_days) from public.organizations where id = a.organization_id
    );
$$;

create or replace function public.suspend_stale_assignments()
returns integer language plpgsql security definer set search_path = public
as $$
declare affected integer;
begin
  update public.care_assignments a
     set status = 'suspended', ended_reason = 'inactivity_90_days'
   where a.status = 'active'
     and a.last_activity_at < now() - (
       select make_interval(days => o.inactivity_days)
       from public.organizations o where o.id = a.organization_id
     );
  get diagnostics affected = row_count;
  return affected;
end;
$$;

alter table public.organizations enable row level security;
alter table public.organization_memberships enable row level security;
alter table public.care_assignments enable row level security;

create policy "master manages organizations" on public.organizations for all
  using (public.is_vicino_master()) with check (public.is_vicino_master());
create policy "owner reads organization" on public.organizations for select
  using (owner_id = auth.uid());
create policy "members read organization" on public.organizations for select
  using (exists(select 1 from public.organization_memberships m where m.organization_id=id and m.user_id=auth.uid() and m.status='active'));

create policy "master manages memberships" on public.organization_memberships for all
  using (public.is_vicino_master()) with check (public.is_vicino_master());
create policy "owner manages memberships" on public.organization_memberships for all
  using (public.is_organization_owner(organization_id)) with check (public.is_organization_owner(organization_id));
create policy "member reads own membership" on public.organization_memberships for select
  using (user_id = auth.uid());

create policy "master audits assignment metadata" on public.care_assignments for select
  using (public.is_vicino_master());
create policy "owner manages assignments" on public.care_assignments for all
  using (public.is_organization_owner(organization_id)) with check (public.is_organization_owner(organization_id));
create policy "participant reads assignments" on public.care_assignments for select
  using (patient_id=auth.uid() or professional_id=auth.uid());

-- Organización inicial y vínculo del paciente existente con la psicóloga demo.
insert into public.organizations (name, owner_id)
select 'Consultorio Vicino Preview', id from public.profiles
where id = (select id from auth.users where email='psicologo.preview@vicino.test')
on conflict do nothing;

insert into public.organization_memberships (organization_id,user_id,role)
select o.id,p.id,p.role from public.organizations o
join public.profiles p on p.id in (
  select id from auth.users where email in ('psicologo.preview@vicino.test','alemolinayart3@gmail.com')
)
where o.name='Consultorio Vicino Preview'
on conflict (organization_id,user_id) do update set status='active', ended_at=null;

insert into public.care_assignments (organization_id,patient_id,professional_id,professional_role,status,starts_at)
select o.id, patient.id, psychologist.id, 'psicologo', 'active', now()
from public.organizations o
join auth.users patient on patient.email='alemolinayart3@gmail.com'
join auth.users psychologist on psychologist.email='psicologo.preview@vicino.test'
where o.name='Consultorio Vicino Preview'
  and not exists (
    select 1 from public.care_assignments a where a.organization_id=o.id and a.patient_id=patient.id
      and a.professional_role='psicologo' and a.status in ('pending','active')
  );

-- Para volver master una cuenta (cambia el correo antes de ejecutar):
-- update auth.users set raw_app_meta_data = coalesce(raw_app_meta_data,'{}'::jsonb) || '{"vicino_master":true}'::jsonb
-- where email = 'TU_CORREO_MASTER';

