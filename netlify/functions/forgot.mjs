import { ensureAdmin, userExists, saveResetCode } from "../../lib/store.mjs";
import { sendCode } from "../../lib/email.mjs";
import { errorResponse, isDbDown } from "../../lib/errors.mjs";

const j = (statusCode, obj) => ({ statusCode, headers: { "Content-Type": "application/json" }, body: JSON.stringify(obj) });

export const handler = async (event) => {
  if (event.httpMethod !== "POST") return j(405, { error: "POST only" });
  try {
    await ensureAdmin();
    const email = String((JSON.parse(event.body || "{}").email) || "").toLowerCase().trim();
    if (!email) return j(400, { ok: false, error: "Informe o email." });
    if (await userExists(email)) {
      const code = String(Math.floor(100000 + Math.random() * 900000));
      const expires = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      await saveResetCode(email, code, expires);
      await sendCode(email, code);
    }
    // resposta genérica (não revela se o email existe)
    return j(200, { ok: true, msg: "Se o e-mail estiver cadastrado, enviamos um código." });
  } catch (e) { return isDbDown(e) ? errorResponse(e, j) : j(502, { ok: false, error: String(e.message || e) }); }
};
