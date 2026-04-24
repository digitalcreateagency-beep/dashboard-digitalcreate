-- Adiciona role 'staff' ao sistema
-- Remove constraint antiga e recria incluindo 'staff'
ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('owner', 'client', 'staff'));

-- Staff vê todos os clientes (mesma política do owner)
DROP POLICY IF EXISTS "staff_see_clients" ON clients;
CREATE POLICY "staff_see_clients" ON clients
  FOR ALL USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('owner', 'staff')
  );

-- Staff vê todos os tokens
DROP POLICY IF EXISTS "staff_see_tokens" ON platform_tokens;
CREATE POLICY "staff_see_tokens" ON platform_tokens
  FOR ALL USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('owner', 'staff')
  );

-- Staff vê todas as métricas
DROP POLICY IF EXISTS "staff_see_metrics" ON metrics_cache;
CREATE POLICY "staff_see_metrics" ON metrics_cache
  FOR ALL USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('owner', 'staff')
  );

-- Staff vê refresh_requests
DROP POLICY IF EXISTS "staff_see_requests" ON refresh_requests;
CREATE POLICY "staff_see_requests" ON refresh_requests
  FOR ALL USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('owner', 'staff')
  );

-- Somente owner pode ver/gerenciar perfis de staff (e de todos)
-- Staff pode ver só o próprio perfil
DROP POLICY IF EXISTS "owner_all_profiles" ON profiles;
CREATE POLICY "owner_all_profiles" ON profiles
  FOR ALL USING (
    auth.uid() = id
    OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'owner'
  );
