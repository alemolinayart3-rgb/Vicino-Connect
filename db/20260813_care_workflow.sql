-- Ejecutar después de 20260813_organizations_and_assignments.sql.
alter table public.profiles add column if not exists birth_date date;

create or replace function public.accept_patient_invitation(invitation_token uuid)
returns uuid language plpgsql security definer set search_path=public as $$
declare invite public.invitations; org_id uuid; assignment_id uuid;
begin
 if auth.uid() is null then raise exception 'Debes iniciar sesión.'; end if;
 select * into invite from public.invitations where token=invitation_token for update;
 if invite.id is null then raise exception 'Invitación no encontrada.'; end if;
 if invite.status<>'pending' or invite.expires_at<now() then raise exception 'La invitación ya no está disponible.'; end if;
 if lower(invite.email)<>lower(coalesce(auth.jwt()->>'email','')) then raise exception 'La invitación pertenece a otro correo.'; end if;
 if invite.role<>'paciente' or not exists(select 1 from public.profiles where id=auth.uid() and role='paciente') then raise exception 'Este acceso requiere una cuenta de paciente.'; end if;
 select id into org_id from public.organizations where owner_id=invite.inviter_id and status='active' order by created_at limit 1;
 if org_id is null then raise exception 'La organización no está activa.'; end if;
 insert into public.organization_memberships(organization_id,user_id,role,status) values(org_id,auth.uid(),'paciente','active')
 on conflict(organization_id,user_id) do update set status='active',ended_at=null;
 insert into public.care_assignments(organization_id,patient_id,professional_id,professional_role,status,starts_at,last_activity_at)
 values(org_id,auth.uid(),invite.inviter_id,'psicologo','active',now(),now())
 on conflict(organization_id,patient_id,professional_role) where status in ('pending','active')
 do update set professional_id=excluded.professional_id,status='active',starts_at=coalesce(public.care_assignments.starts_at,now()),ends_at=null,ended_reason=null,last_activity_at=now()
 returning id into assignment_id;
 update public.invitations set status='accepted',accepted_by=auth.uid(),accepted_at=now() where id=invite.id;
 return assignment_id;
end $$;
grant execute on function public.accept_patient_invitation(uuid) to authenticated;

create or replace function public.my_care_team()
returns table(assignment_id uuid,professional_id uuid,full_name text,role public.user_role,status public.assignment_status,last_activity_at timestamptz)
language sql stable security definer set search_path=public as $$
 select a.id,p.id,p.full_name,a.professional_role,case when public.assignment_is_current(a) then a.status else 'suspended'::public.assignment_status end,a.last_activity_at
 from public.care_assignments a join public.profiles p on p.id=a.professional_id join public.organizations o on o.id=a.organization_id
 where a.patient_id=auth.uid() and a.status in('active','suspended') and o.status='active' order by a.professional_role,a.created_at desc $$;

create or replace function public.my_assigned_patients()
returns table(assignment_id uuid,patient_id uuid,full_name text,status public.assignment_status,last_activity_at timestamptz)
language sql stable security definer set search_path=public as $$
 select a.id,p.id,p.full_name,case when public.assignment_is_current(a) then a.status else 'suspended'::public.assignment_status end,a.last_activity_at
 from public.care_assignments a join public.profiles p on p.id=a.patient_id join public.organizations o on o.id=a.organization_id
 where a.professional_id=auth.uid() and a.status in('active','suspended') and o.status='active' order by p.full_name $$;
grant execute on function public.my_care_team() to authenticated;
grant execute on function public.my_assigned_patients() to authenticated;

create or replace function public.reactivate_assignment(target_assignment uuid)
returns void language plpgsql security definer set search_path=public as $$
begin
 update public.care_assignments a set status='active',last_activity_at=now(),ends_at=null,ended_reason=null
 where a.id=target_assignment and public.is_organization_owner(a.organization_id);
 if not found then raise exception 'No puedes reactivar este vínculo.'; end if;
end $$;
grant execute on function public.reactivate_assignment(uuid) to authenticated;

create or replace function public.replace_professional(target_assignment uuid,new_professional uuid)
returns uuid language plpgsql security definer set search_path=public as $$
declare old public.care_assignments; next_id uuid;
begin
 select * into old from public.care_assignments where id=target_assignment for update;
 if old.id is null or not public.is_organization_owner(old.organization_id) then raise exception 'No puedes modificar este vínculo.'; end if;
 if not exists(select 1 from public.organization_memberships where organization_id=old.organization_id and user_id=new_professional and role=old.professional_role and status='active') then raise exception 'El nuevo profesional no pertenece a la organización con ese rol.'; end if;
 update public.care_assignments set status='ended',ends_at=now(),ended_reason='professional_replaced' where id=old.id;
 insert into public.care_assignments(organization_id,patient_id,professional_id,professional_role,status,starts_at,last_activity_at)
 values(old.organization_id,old.patient_id,new_professional,old.professional_role,'active',now(),now()) returning id into next_id;
 update public.care_assignments set replaced_by=next_id where id=old.id;
 return next_id;
end $$;
grant execute on function public.replace_professional(uuid,uuid) to authenticated;
