// Health check público: confirma que o banco respondeu. Não exige login e não
// devolve dado sensível — só o backend em uso e o estado da conexão.
import { getTokens, BACKEND } from "../../lib/store.mjs";
import { isDbDown } from "../../lib/errors.mjs";

const j = (statusCode, obj) => ({
  statusCode,
  headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  body: JSON.stringify(obj),
});

export const handler = async () => {
  try {
    await getTokens();                      // toca o banco de verdade
    return j(200, { ok: true, backend: BACKEND, at: new Date().toISOString() });
  } catch (e) {
    const msg = String((e && e.message) || e).slice(0, 160);
    return j(isDbDown(e) ? 503 : 500, { ok: false, backend: BACKEND, db: isDbDown(e) ? "offline" : "erro", err: msg });
  }
};
