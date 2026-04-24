-- Perfis de usuário (owner e client)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  role text not null check (role in ('owner', 'client')),
  full_name text,
  company_name text,
  email text,
  avatar_url text,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Clientes (empresas)
create table clients (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid references profiles(id) on delete cascade,
  user_id uuid references profiles(id) on delete set null,
  company_name text not null,
  logo_url text,
  is_active boolean default true,
  can_see_meta_ads boolean default false,
  can_see_google_ads boolean default false,
  can_see_instagram boolean default false,
  can_see_facebook_page boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Tokens OAuth das plataformas por cliente
create table platform_tokens (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references clients(id) on delete cascade,
  platform text not null check (platform in ('meta_ads', 'google_ads', 'instagram', 'facebook_page')),
  access_token text,
  refresh_token text,
  account_id text,
  page_id text,
  token_expires_at timestamptz,
  is_connected boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(client_id, platform)
);

-- Cache de métricas (atualizado pelas Edge Functions)
create table metrics_cache (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references clients(id) on delete cascade,
  platform text not null,
  date date not null,
  impressions bigint default 0,
  clicks bigint default 0,
  spend numeric(10,2) default 0,
  reach bigint default 0,
  conversions bigint default 0,
  cpc numeric(10,4) default 0,
  cpm numeric(10,4) default 0,
  ctr numeric(8,4) default 0,
  roas numeric(8,4) default 0,
  raw_data jsonb,
  fetched_at timestamptz default now(),
  unique(client_id, platform, date)
);

-- RLS (Row Level Security)
alter table profiles enable row level security;
alter table clients enable row level security;
alter table platform_tokens enable row level security;
alter table metrics_cache enable row level security;

-- Owner vê tudo; cliente vê apenas o próprio registro
create policy "owner_all_profiles" on profiles for all using (
  auth.uid() = id or exists (select 1 from profiles where id = auth.uid() and role = 'owner')
);

create policy "owner_all_clients" on clients for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'owner')
);

create policy "client_own_record" on clients for select using (
  user_id = auth.uid()
);

create policy "owner_all_tokens" on platform_tokens for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'owner')
);

create policy "owner_all_metrics" on metrics_cache for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'owner')
);

create policy "client_own_metrics" on metrics_cache for select using (
  client_id in (select id from clients where user_id = auth.uid() and is_active = true)
);

-- Função para atualizar updated_at
create or replace function update_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger clients_updated_at before update on clients
  for each row execute function update_updated_at();
create trigger tokens_updated_at before update on platform_tokens
  for each row execute function update_updated_at();
