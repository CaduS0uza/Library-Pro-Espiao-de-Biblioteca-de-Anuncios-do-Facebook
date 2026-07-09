# Library Pro — Espião de Biblioteca de Anúncios do Facebook

SaaS para espionar anúncios ativos na **Biblioteca de Anúncios do Meta/Facebook** por nicho.
Busca criativos reais (foto e vídeo) de concorrentes via [Apify](https://apify.com)
(`apify/facebook-ads-scraper`), mostrando quantos anúncios ativos cada criativo tem,
há quantos dias está no ar, a copy e o link direto pra biblioteca.

## Recursos

- 🔎 Busca por nicho com filtros (funil, ticket, vertical, nº mínimo de ativos)
- 🖼 Grid de criativos com preview em popup (foto/vídeo) e botão **Copiar JSON do criativo**
- 👥 Multiusuário: login/senha (senha cifrada AES-256-GCM), cadastro com login automático
- 🔐 Painel admin: usuários, buscas (IP/país), tokens Apify e saldo — só para o admin
- ♻️ Contingência de múltiplos tokens Apify com failover por saldo
- ✉️ Recuperação de senha por e-mail (Resend) com código de verificação

## Stack

- Front único (`public/index.html`) — sem build
- Funções serverless: **Vercel** (`api/`) ou **Netlify** (`netlify/functions/`) — mesma lógica via adaptador
- Banco: **Supabase** (fallback: Netlify Blobs)

## Rodando local

```bash
npm install
cp .env.example .env    # preencha as chaves
APIFY_TOKEN=seu_token node server.mjs   # http://localhost:4500
```

## Variáveis de ambiente

Veja [`.env.example`](.env.example). **Nenhuma chave fica no código** — tudo via env var.

## Deploy

- **Vercel:** `vercel deploy --prod` (config em `vercel.json`, serve só `public/`)
- **Netlify:** `netlify deploy --prod --dir public` (config em `netlify.toml`)

> ⚠️ Sempre publique apenas `public/` — assim `server.mjs` e `lib/` nunca ficam expostos.
