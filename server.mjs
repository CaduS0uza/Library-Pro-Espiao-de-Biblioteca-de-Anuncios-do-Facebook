// Servidor LOCAL (espelha as funções da Netlify): serve o app + ponte com o Apify.
// Rodar:  node server.mjs  →  http://localhost:4500
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { startRun, pollResult } from "./lib/apify.mjs";

const DIR = dirname(fileURLToPath(import.meta.url));
const PORT = 4500;

// Token do Apify SEMPRE via env var (nunca hardcode). Local: `APIFY_TOKEN=... node server.mjs`.
const APIFY_TOKEN = process.env.APIFY_TOKEN || "";

const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".csv": "text/csv", ".md": "text/markdown" };
const json = (res, code, obj) => { res.writeHead(code, { "Content-Type": "application/json" }); res.end(JSON.stringify(obj)); };

const server = createServer((req, res) => {
  const url = new URL(req.url, "http://x");

  if (req.method === "POST" && url.pathname === "/api/start") {
    let body = ""; req.on("data", c => (body += c));
    req.on("end", async () => {
      try {
        const p = JSON.parse(body || "{}");
        const out = await startRun(p, APIFY_TOKEN);
        json(res, 200, out);
      } catch (e) { json(res, 502, { error: String(e.message || e) }); }
    });
    return;
  }
  if (req.method === "GET" && url.pathname === "/api/result") {
    (async () => {
      try {
        const out = await pollResult(url.searchParams.get("runId"), APIFY_TOKEN);
        json(res, 200, out);
      } catch (e) { json(res, 502, { error: String(e.message || e) }); }
    })();
    return;
  }

  // estático (servido da pasta public/ — mesma que a Netlify publica)
  const path = (url.pathname === "/" ? "/index.html" : url.pathname);
  readFile(join(DIR, "public", decodeURIComponent(path)))
    .then(data => { const ext = path.slice(path.lastIndexOf(".")); res.writeHead(200, { "Content-Type": TYPES[ext] || "application/octet-stream" }); res.end(data); })
    .catch(() => { res.writeHead(404); res.end("not found"); });
});

server.listen(PORT, () => console.log(`Espionagem no ar → http://localhost:${PORT}`));
