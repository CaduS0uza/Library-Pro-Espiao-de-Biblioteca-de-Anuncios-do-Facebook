import { ensureAdmin, signup } from "../../lib/store.mjs";
import { errorResponse, isDbDown } from "../../lib/errors.mjs";

const j = (statusCode, obj) => ({ statusCode, headers: { "Content-Type": "application/json" }, body: JSON.stringify(obj) });
const emailOk = (e) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e);

export const handler = async (event) => {
  if (event.httpMethod !== "POST") return j(405, { error: "POST only" });
  try {
    await ensureAdmin();
    const { email, pass } = JSON.parse(event.body || "{}");
    if (!emailOk(email || "")) return j(400, { ok: false, error: "Email inválido." });
    if (!pass || String(pass).length < 4) return j(400, { ok: false, error: "Senha muito curta (mín. 4)." });
    await signup(email, pass);
    return j(200, { ok: true });
  } catch (e) {
    if (isDbDown(e)) return errorResponse(e, j);
    return j(400, { ok: false, error: String(e.message || e) });
  }
};
