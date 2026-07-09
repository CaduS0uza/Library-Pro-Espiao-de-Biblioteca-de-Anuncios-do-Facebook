-- Schema do libpro (rodar no SQL Editor do Supabase libpro)
-- Segurança: RLS LIGADO sem policies públicas => só a service_role (servidor) acessa.

create table if not exists app_users (
  email      text primary key,
  pass_enc   text not null,
  role       text not null default 'user',
  created_at timestamptz not null default now()
);

create table if not exists apify_tokens (
  id         text primary key,
  label      text not null,
  token      text not null,
  created_at timestamptz not null default now()
);

create table if not exists searches (
  id          bigint generated always as identity primary key,
  email       text,
  nicho       text,
  url         text,
  ip          text,
  ua          text,
  country     text,
  token_label text,
  ts          timestamptz not null default now()
);
create index if not exists idx_searches_ts on searches (ts desc);
create index if not exists idx_searches_email on searches (email);

-- RLS: liga e NÃO cria policy pública. A service_role ignora RLS (servidor entra);
-- chaves anon/publishable ficam sem acesso a nada => banco blindado de fora.
alter table app_users   enable row level security;
alter table apify_tokens enable row level security;
alter table searches     enable row level security;
