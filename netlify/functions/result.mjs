import { pollResult } from "../../lib/apify.mjs";
import { auth, getTokens } from "../../lib/store.mjs";
import { errorResponse, isDbDown } from "../../lib/errors.mjs";

const j = (statusCode, obj) => ({ statusCode, headers: { "Content-Type": "application/json" }, body: JSON.stringify(obj) });

export const handler = async (event) => {
  const user = await auth(event);
  if (!user) return j(401, { error: "Faça login." });
  try {
    const { runId, tokenId } = event.queryStringParameters || {};
    if (!runId) return j(400, { error: "Sem runId." });
    const tokens = await getTokens();
    const t = tokens.find(x => x.id === tokenId) || tokens[0];
    if (!t) return j(500, { error: "Token não encontrado." });
    return j(200, await pollResult(runId, t.token));
  } catch (e) { return isDbDown(e) ? errorResponse(e, j) : j(502, { error: String(e.message || e) }); }
};
