-- Schema do libpro (rodar no SQL Editor do Supabase do projeto itqgqyccunzsnbloinvs)
-- Segurança: RLS LIGADO sem policies públicas => só a service_role (servidor) acessa.
--
-- 2026-08-18: acrescentados `app_users.status` e a tabela `reset_codes`, que o
-- código já usava mas não existiam aqui. Sem `status`, o login recusa todo mundo;
-- sem `reset_codes`, a recuperação de senha quebra.

create table if not exists app_users (
  email      text primary key,
  pass_enc   text not null,
  role       text not null default 'user',
  status     text not null default 'ativo',   -- ativo | pendente | bloqueado
  created_at timestamptz not null default now()
);
-- idempotente: se a tabela já existir de uma versão antiga, ganha a coluna
alter table app_users add column if not exists status text not null default 'ativo';

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

-- Código de verificação da recuperação de senha (upsert por email).
create table if not exists reset_codes (
  email      text primary key,
  code       text not null,
  expires_at timestamptz not null
);

-- RLS: liga e NÃO cria policy pública. A service_role ignora RLS (servidor entra);
-- chaves anon/publishable ficam sem acesso a nada => banco blindado de fora.
alter table app_users    enable row level security;
alter table apify_tokens enable row level security;
alter table searches     enable row level security;
alter table reset_codes  enable row level security;
