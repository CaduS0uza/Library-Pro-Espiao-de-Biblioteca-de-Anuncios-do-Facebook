// Separa "banco fora do ar" de "credencial errada".
// Sem isso um Supabase pausado vira "Email ou senha inválidos" na tela do usuário.

export class DbError extends Error {
  constructor(msg) { super(String(msg || "erro no banco")); this.name = "DbError"; }
}

// Falha de rede/DNS/projeto pausado — nada a ver com o dado consultado.
const OFFLINE = /fetch failed|failed to fetch|ENOTFOUND|EAI_AGAIN|ECONNREFUSED|ECONNRESET|ETIMEDOUT|getaddrinfo|socket hang up|network|timeout|paused|not configured|não configurado/i;

export const isDbDown = (e) => OFFLINE.test(String((e && e.message) || e || ""));

export const DB_DOWN_MSG = "Banco de dados indisponível no momento. Tente novamente em alguns minutos.";

// Resposta HTTP certa pro erro: 503 quando é o banco, 500 quando é bug nosso.
export const errorResponse = (e, j) => isDbDown(e)
  ? j(503, { ok: false, error: DB_DOWN_MSG, detail: String((e && e.message) || e).slice(0, 160) })
  : j(500, { ok: false, error: String((e && e.message) || e) });
