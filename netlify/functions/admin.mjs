import { getUsage } from "../../lib/apify.mjs";
import { auth, getTokens, addToken, delToken, listUsersFull, addUser, delUser, setStatus, getSearches } from "../../lib/store.mjs";

const j = (statusCode, obj) => ({ statusCode, headers: { "Content-Type": "application/json" }, body: JSON.stringify(obj) });
const mask = (t) => t ? t.slice(0, 12) + "…" + t.slice(-4) : "";

export const handler = async (event) => {
  const user = await auth(event);
  if (!user) return j(401, { error: "Faça login." });
  if (user.role !== "admin") return j(403, { error: "Acesso só de admin." });

  const q = event.queryStringParameters || {};
  const action = q.action || "overview";
  const body = event.httpMethod === "POST" ? JSON.parse(event.body || "{}") : {};

  try {
    if (action === "overview") {
      const tokensRaw = await getTokens();
      const tokens = await Promise.all(tokensRaw.map(async (t) => {
        const u = await getUsage(t.token);
        const disponivel = (u.limit != null && u.spent != null) ? Math.max(0, u.limit - u.spent) : null;
        return { id: t.id, label: t.label, masked: mask(t.token), spent: u.spent, limit: u.limit, disponivel, cycleEnd: u.cycleEnd, ok: u.ok };
      }));
      const users = await listUsersFull();
      const searches = await getSearches(300);
      return j(200, { tokens, users, searches, me: user.email });
    }
    if (action === "addToken") {
      if (!body.token) return j(400, { error: "Cole o token." });
      await addToken(body.label || "Token", body.token);
      return j(200, { ok: true });
    }
    if (action === "delToken") { await delToken(body.id); return j(200, { ok: true }); }
    if (action === "addUser") {
      if (!body.email || !body.pass) return j(400, { error: "Email e senha obrigatórios." });
      // SÓ o e-mail dono (ADMIN_EMAIL) pode ser admin — qualquer outro entra como "user"
      const adminEmail = (process.env.ADMIN_EMAIL || "").toLowerCase();
      const role = String(body.email).toLowerCase() === adminEmail ? "admin" : "user";
      await addUser(body.email, body.pass, role, "ativo");
      return j(200, { ok: true });
    }
    if (action === "delUser") {
      if ((body.email || "").toLowerCase() === user.email) return j(400, { error: "Não dá pra excluir você mesmo." });
      await delUser(body.email);
      return j(200, { ok: true });
    }
    if (action === "setStatus") {
      if ((body.email || "").toLowerCase() === user.email) return j(400, { error: "Não dá pra alterar seu próprio status." });
      const st = ["ativo", "pendente", "bloqueado"].includes(body.status) ? body.status : "pendente";
      await setStatus(body.email, st);
      return j(200, { ok: true });
    }
    return j(400, { error: "Ação inválida." });
  } catch (e) { return j(502, { error: String(e.message || e) }); }
};
