-- Invitaciones internas para pacientes que ya tienen cuenta en Vicino.
-- Ejecutar después de 20260813_care_workflow.sql.
create or replace function public.my_pending_patient_invitations()
returns table(invitation_id uuid,token uuid,professional_name text,organization_name text,expires_at timestamptz,created_at timestamptz)
language sql stable security definer set search_path=public as $$
 select i.id,i.token,p.full_name,o.name,i.expires_at,i.created_at
 from public.invitations i join public.profiles p on p.id=i.inviter_id
 left join public.organizations o on o.owner_id=i.inviter_id and o.status='active'
 where auth.uid() is not null and lower(i.email)=lower(coalesce(auth.jwt()->>'email',''))
 and i.role='paciente' and i.status='pending' and i.expires_at>now()
 order by i.created_at desc $$;
create or replace function public.decline_patient_invitation(invitation_token uuid)
returns void language plpgsql security definer set search_path=public as $$
begin
 update public.invitations set status='revoked' where token=invitation_token and status='pending'
 and lower(email)=lower(coalesce(auth.jwt()->>'email',''));
 if not found then raise exception 'La invitación ya no está disponible.'; end if;
end $$;
grant execute on function public.my_pending_patient_invitations() to authenticated;
grant execute on function public.decline_patient_invitation(uuid) to authenticated;
