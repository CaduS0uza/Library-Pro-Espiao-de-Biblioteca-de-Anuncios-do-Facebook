// Lógica compartilhada com o Apify (start + poll + mapeamento + gasto).
const ACTOR = "apify~facebook-ads-scraper";

// Gasto do mês / limite, por token — pro painel admin e pra contingência.
export async function getUsage(token) {
  try {
    const r = await fetch(`https://api.apify.com/v2/users/me/limits?token=${encodeURIComponent(token)}`);
    const d = (await r.json()).data || {};
    return {
      ok: r.ok,
      spent: d.current ? d.current.monthlyUsageUsd : null,
      limit: d.limits ? d.limits.maxMonthlyUsageUsd : null,
      cycleEnd: d.monthlyUsageCycle ? d.monthlyUsageCycle.endAt : null,
    };
  } catch { return { ok: false, spent: null, limit: null, cycleEnd: null }; }
}

export async function startRun(p, token) {
  if (!token) throw new Error("Token do Apify não configurado.");
  const input = {
    startUrls: [{ url: p.url }],
    resultsLimit: p.limit || 100,
    activeStatus: p.activeStatus || "active",
    isDetailsPerAd: false,
  };
  const r = await fetch(`https://api.apify.com/v2/acts/${ACTOR}/runs?token=${encodeURIComponent(token)}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input),
  });
  const d = await r.json();
  if (!r.ok) throw new Error((d.error && d.error.message) || `Apify ${r.status}`);
  return { runId: d.data.id, datasetId: d.data.defaultDatasetId };
}

export async function pollResult(runId, token) {
  if (!token) throw new Error("Token do Apify não configurado.");
  if (!runId) throw new Error("Sem runId.");
  const r = await fetch(`https://api.apify.com/v2/actor-runs/${encodeURIComponent(runId)}?token=${encodeURIComponent(token)}`);
  const d = await r.json();
  const status = d.data && d.data.status;
  if (status !== "SUCCEEDED") {
    if (["FAILED", "ABORTED", "TIMED-OUT", "TIMED_OUT"].includes(status)) return { status: "error", erro: status };
    return { status: "running" };
  }
  const ir = await fetch(`https://api.apify.com/v2/datasets/${d.data.defaultDatasetId}/items?token=${encodeURIComponent(token)}&clean=true`);
  const items = await ir.json();
  return { status: "done", ads: items.map(mapItem).filter(Boolean) };
}

export function mapItem(it) {
  const s = it.snapshot || {};
  const card = (s.cards && s.cards[0]) || {};
  const imgO = (s.images && s.images[0]) || {};
  const vid = (s.videos && s.videos[0]) || {};
  const video = vid.videoHdUrl || vid.videoSdUrl || card.videoHdUrl || card.videoSdUrl || null;
  const image = imgO.originalImageUrl || imgO.resizedImageUrl ||
                card.originalImageUrl || card.resizedImageUrl ||
                vid.videoPreviewImageUrl || card.videoPreviewImageUrl || null;
  const copy = (s.body && s.body.text) || s.title || s.caption || s.linkDescription || (card.body && card.body.text) || "";
  const adv = it.pageName || s.pageName || "Anunciante";
  const id = it.adArchiveID || it.adArchiveId || it.adId;
  if (!image && !video) return null;
  const ativos = Number(it.collationCount) || 1;
  const startMs = typeof it.startDate === "number" ? it.startDate * 1000 : Date.parse(it.startDateFormatted || "");
  const diasAtivo = startMs ? Math.max(0, Math.floor((Date.now() - startMs) / 86400000)) : null;
  return {
    adv, copy: copy.slice(0, 300), fmt: video ? "video" : "foto", image, video, ativos, diasAtivo,
    cta: s.ctaText || "",
    link: id ? `https://www.facebook.com/ads/library/?id=${id}` : (it.url || it.inputUrl || ""),
  };
}
