-- Adiciona colunas de segmentação na tabela clients
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS sector       text,
  ADD COLUMN IF NOT EXISTS plan         text DEFAULT 'starter',
  ADD COLUMN IF NOT EXISTS client_status text DEFAULT 'ativo';

-- Índices para filtros rápidos
CREATE INDEX IF NOT EXISTS idx_clients_sector        ON clients(sector);
CREATE INDEX IF NOT EXISTS idx_clients_plan          ON clients(plan);
CREATE INDEX IF NOT EXISTS idx_clients_client_status ON clients(client_status);
