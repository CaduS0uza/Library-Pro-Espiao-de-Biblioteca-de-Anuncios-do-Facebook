import { ensureAdmin, getResetCode } from "../../lib/store.mjs";

const j = (statusCode, obj) => ({ statusCode, headers: { "Content-Type": "application/json" }, body: JSON.stringify(obj) });

export const handler = async (event) => {
  if (event.httpMethod !== "POST") return j(405, { error: "POST only" });
  try {
    await ensureAdmin();
    const { email, code } = JSON.parse(event.body || "{}");
    const em = String(email || "").toLowerCase().trim();
    if (!em || !code) return j(400, { ok: false, error: "Informe o código." });
    const rec = await getResetCode(em);
    if (!rec || String(rec.code) !== String(code).trim()) return j(400, { ok: false, error: "Código incorreto." });
    if (new Date(rec.expires_at).getTime() < Date.now()) return j(400, { ok: false, error: "Código expirado. Peça outro." });
    return j(200, { ok: true });
  } catch (e) { return j(502, { ok: false, error: String(e.message || e) }); }
};
