-- Corrige la aceptación de invitaciones para conservar el rol real
-- del profesional que invita (psicólogo o psiquiatra).
-- Es seguro ejecutarlo aunque 20260813_care_workflow.sql ya se haya ejecutado.

create or replace function public.accept_patient_invitation(invitation_token uuid)
returns uuid
language plpgsql
security definer
set search_path=public
as $$
declare
  invite public.invitations;
  org_id uuid;
  assignment_id uuid;
  inviter_role public.user_role;
begin
  if auth.uid() is null then
    raise exception 'Debes iniciar sesión.';
  end if;

  select * into invite
  from public.invitations
  where token=invitation_token
  for update;

  if invite.id is null then
    raise exception 'Invitación no encontrada.';
  end if;
  if invite.status <> 'pending' or invite.expires_at < now() then
    raise exception 'La invitación ya no está disponible.';
  end if;
  if lower(invite.email) <> lower(coalesce(auth.jwt()->>'email','')) then
    raise exception 'La invitación pertenece a otro correo.';
  end if;
  if invite.role <> 'paciente' or not exists (
    select 1 from public.profiles where id=auth.uid() and role='paciente'
  ) then
    raise exception 'Este acceso requiere una cuenta de paciente.';
  end if;

  select role into inviter_role
  from public.profiles
  where id=invite.inviter_id;

  if inviter_role not in ('psicologo','psiquiatra') then
    raise exception 'La cuenta que invita no es un profesional válido.';
  end if;

  select id into org_id
  from public.organizations
  where owner_id=invite.inviter_id and status='active'
  order by created_at
  limit 1;

  if org_id is null then
    raise exception 'La organización no está activa.';
  end if;

  insert into public.organization_memberships(organization_id,user_id,role,status)
  values(org_id,auth.uid(),'paciente','active')
  on conflict(organization_id,user_id)
  do update set status='active',ended_at=null;

  insert into public.care_assignments(
    organization_id,patient_id,professional_id,professional_role,status,
    starts_at,last_activity_at
  )
  values(
    org_id,auth.uid(),invite.inviter_id,inviter_role,'active',now(),now()
  )
  on conflict(organization_id,patient_id,professional_role)
  where status in ('pending','active')
  do update set
    professional_id=excluded.professional_id,
    status='active',
    starts_at=coalesce(public.care_assignments.starts_at,now()),
    ends_at=null,
    ended_reason=null,
    last_activity_at=now()
  returning id into assignment_id;

  update public.invitations
  set status='accepted',accepted_by=auth.uid(),accepted_at=now()
  where id=invite.id;

  return assignment_id;
end
$$;

grant execute on function public.accept_patient_invitation(uuid) to authenticated;

