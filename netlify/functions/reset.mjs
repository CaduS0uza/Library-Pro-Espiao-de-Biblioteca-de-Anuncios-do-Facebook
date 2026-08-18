import { ensureAdmin, getResetCode, delResetCode, setPassword } from "../../lib/store.mjs";
import { errorResponse, isDbDown } from "../../lib/errors.mjs";

const j = (statusCode, obj) => ({ statusCode, headers: { "Content-Type": "application/json" }, body: JSON.stringify(obj) });

export const handler = async (event) => {
  if (event.httpMethod !== "POST") return j(405, { error: "POST only" });
  try {
    await ensureAdmin();
    const { email, code, pass } = JSON.parse(event.body || "{}");
    const em = String(email || "").toLowerCase().trim();
    if (!em || !code) return j(400, { ok: false, error: "Email e código obrigatórios." });
    if (!pass || String(pass).length < 4) return j(400, { ok: false, error: "Senha muito curta (mín. 4)." });
    const rec = await getResetCode(em);
    if (!rec || String(rec.code) !== String(code)) return j(400, { ok: false, error: "Código inválido." });
    if (new Date(rec.expires_at).getTime() < Date.now()) return j(400, { ok: false, error: "Código expirado. Peça outro." });
    await setPassword(em, pass);
    await delResetCode(em);
    return j(200, { ok: true });
  } catch (e) { return isDbDown(e) ? errorResponse(e, j) : j(502, { ok: false, error: String(e.message || e) }); }
};
