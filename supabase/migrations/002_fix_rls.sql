-- Fix RLS recursion no profiles
drop policy if exists "owner_all_profiles" on profiles;

-- Política simples: cada user lê/edita o próprio perfil
create policy "users_own_profile" on profiles for all using (
  auth.uid() = id
);

-- Política separada para owner ver todos os profiles
create policy "owner_read_all_profiles" on profiles for select using (
  exists (
    select 1 from profiles p
    where p.id = auth.uid() and p.role = 'owner'
    limit 1
  )
);

-- Confirmar email do owner manualmente (sem precisar de email)
update auth.users
set email_confirmed_at = now(),
    confirmed_at = now()
where email = 'digitalcreateagency@gmail.com';
