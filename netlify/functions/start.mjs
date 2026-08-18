import { startRun, getUsage } from "../../lib/apify.mjs";
import { auth, getTokens, logSearch, countRecentByUser } from "../../lib/store.mjs";
import { errorResponse, isDbDown } from "../../lib/errors.mjs";

const j = (statusCode, obj) => ({ statusCode, headers: { "Content-Type": "application/json" }, body: JSON.stringify(obj) });

function origem(event) {
  const h = event.headers || {};
  const ip = h["x-nf-client-connection-ip"] || (h["x-forwarded-for"] || "").split(",")[0].trim() || "";
  const ua = h["user-agent"] || "";
  let country = "";
  try { country = JSON.parse(Buffer.from(h["x-nf-geo"] || "", "base64").toString("utf8")).country?.code || ""; } catch {}
  return { ip, ua, country };
}

export const handler = async (event) => {
  const user = await auth(event);
  if (!user) return j(401, { error: "Faça login." });
  if (event.httpMethod !== "POST") return j(405, { error: "POST only" });
  try {
    // rate-limit: máx 6 buscas/min por usuário (anti-abuso e protege crédito)
    if (await countRecentByUser(user.email, 60000) >= 6) return j(429, { error: "Muitas buscas seguidas. Espere 1 minuto." });

    const p = JSON.parse(event.body || "{}");
    if (!p.url || typeof p.url !== "string" || !p.url.startsWith("https://www.facebook.com/ads/library/"))
      return j(400, { error: "Busca inválida." });

    const tokens = await getTokens();
    if (!tokens.length) return j(500, { error: "Nenhum token Apify configurado." });

    // contingência: escolhe o primeiro token com saldo no mês
    let chosen = null;
    for (const t of tokens) {
      const u = await getUsage(t.token);
      if (u.limit == null || u.spent == null || u.spent < u.limit - 0.02) { chosen = t; break; }
    }
    if (!chosen) chosen = tokens[tokens.length - 1];

    const out = await startRun(p, chosen.token);

    const o = origem(event);
    await logSearch({ email: user.email, nicho: (p.nicho || "").slice(0, 120), url: p.url, ip: o.ip, ua: o.ua.slice(0, 300), country: o.country, token_label: chosen.label });

    return j(200, { ...out, tokenId: chosen.id });
  } catch (e) { return isDbDown(e) ? errorResponse(e, j) : j(502, { error: String(e.message || e) }); }
};
