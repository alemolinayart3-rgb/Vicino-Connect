-- Vicino Connect: permite que cada paciente edite únicamente su propio perfil.
-- Ejecutar una sola vez en Supabase > SQL Editor.

alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists birth_date date;
alter table public.profiles enable row level security;

drop policy if exists "users update own profile" on public.profiles;
create policy "users update own profile" on public.profiles
for update to authenticated
using (id = auth.uid())
with check (id = auth.uid());

grant select on public.profiles to authenticated;
grant update (full_name, phone, birth_date) on public.profiles to authenticated;
notify pgrst, 'reload schema';
