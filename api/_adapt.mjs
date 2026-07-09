// Adaptador: transforma um handler estilo Netlify (event) numa função Vercel (req,res).
// Reaproveita 100% da lógica das funções em netlify/functions/ — zero duplicação de regra.
export function toVercel(handler) {
  return async (req, res) => {
    const headers = { ...req.headers };
    // compat: recria os headers que as funções Netlify esperam (IP + geo)
    const xff = headers["x-forwarded-for"] || "";
    if (!headers["x-nf-client-connection-ip"] && xff) headers["x-nf-client-connection-ip"] = xff;
    const cc = headers["x-vercel-ip-country"];
    if (cc && !headers["x-nf-geo"]) headers["x-nf-geo"] = Buffer.from(JSON.stringify({ country: { code: cc } })).toString("base64");

    const body = req.body == null ? "" : (typeof req.body === "string" ? req.body : JSON.stringify(req.body));
    const event = { httpMethod: req.method, headers, queryStringParameters: req.query || {}, body };

    try {
      const r = await handler(event);
      res.status(r.statusCode || 200);
      for (const [k, v] of Object.entries(r.headers || {})) res.setHeader(k, v);
      res.send(r.body);
    } catch (e) {
      res.status(500).json({ error: String((e && e.message) || e) });
    }
  };
}
