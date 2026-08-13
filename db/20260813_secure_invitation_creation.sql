-- Corrige la creación de múltiples invitaciones bajo RLS.
-- Ejecutar después de las migraciones anteriores.

create or replace function public.create_patient_invitation(
  patient_email text,
  patient_name text default null
)
returns public.invitations
language plpgsql
security definer
set search_path=public
as $$
declare
  result public.invitations;
begin
  if auth.uid() is null then raise exception 'Debes iniciar sesión.'; end if;
  if not exists(select 1 from public.profiles where id=auth.uid() and role='psicologo') then
    raise exception 'Solo una cuenta de Psicología puede invitar pacientes.';
  end if;
  if not exists(select 1 from public.organizations where owner_id=auth.uid() and status='active') then
    raise exception 'Necesitas una organización activa para invitar pacientes.';
  end if;
  if patient_email is null or trim(patient_email)='' then raise exception 'Escribe un correo válido.'; end if;

  -- Evita varias solicitudes pendientes idénticas, pero permite volver a invitar
  -- después de aceptar, rechazar, revocar o vencer la anterior.
  select * into result from public.invitations
  where inviter_id=auth.uid() and lower(email)=lower(trim(patient_email))
    and role='paciente' and status='pending' and expires_at>now()
  order by created_at desc limit 1;
  if result.id is not null then return result; end if;

  insert into public.invitations(inviter_id,email,invitee_name,role,status)
  values(auth.uid(),lower(trim(patient_email)),nullif(trim(patient_name),''),'paciente','pending')
  returning * into result;
  return result;
end;
$$;

grant execute on function public.create_patient_invitation(text,text) to authenticated;

