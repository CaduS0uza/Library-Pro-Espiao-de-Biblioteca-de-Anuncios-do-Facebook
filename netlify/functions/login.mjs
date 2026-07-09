import { ensureAdmin, loginCheck } from "../../lib/store.mjs";

const j = (statusCode, obj) => ({ statusCode, headers: { "Content-Type": "application/json" }, body: JSON.stringify(obj) });

export const handler = async (event) => {
  if (event.httpMethod !== "POST") return j(405, { error: "POST only" });
  try {
    await ensureAdmin();
    const { email, pass } = JSON.parse(event.body || "{}");
    if (!email || !pass) return j(400, { ok: false, error: "Preencha email e senha." });
    const u = await loginCheck(email, pass);
    if (!u) return j(401, { ok: false, error: "Email ou senha inválidos." });
    if (u.status !== "ativo") {
      const m = u.status === "bloqueado" ? "Acesso bloqueado pelo admin." : "Conta aguardando aprovação do admin.";
      return j(403, { ok: false, error: m });
    }
    return j(200, { ok: true, role: u.role, email: u.email });
  } catch (e) { return j(500, { error: String(e.message || e) }); }
};
