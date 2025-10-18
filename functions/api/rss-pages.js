// Build an RSS feed from web pages (e.g., learn.microsoft.com Purview).
// Query params:
//   base=https://learn.microsoft.com/en-us/purview/   (required)
//   depth=0|1 (default 0; when 1, include same-path <a href> children up to 50)
//   limit=50 (max pages to include)
//   ua=... (optional custom UA)
function xmlEscape(s) {
  return String(s || "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}
function textBetween(html, start, end) {
  const s = html.indexOf(start); if (s === -1) return "";
  const e = html.indexOf(end, s + start.length); if (e === -1) return "";
  return html.slice(s + start.length, e);
}
function samePath(u, base) {
  try {
    const a = new URL(u, base), b = new URL(base);
    return a.origin === b.origin && a.pathname.startsWith(b.pathname);
  } catch { return false; }
}
async function fetchPage(u, ua) {
  const res = await fetch(u, { headers: { "User-Agent": ua || "cf-pages-rss-pages" } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${u}`);
  const html = await res.text();
  const title = textBetween(html, "<title>", "</title>").trim() || u;
  const lm = res.headers.get("Last-Modified") || new Date().toUTCString();
  return { url: u, title, lastModified: lm };
}
async function crawl(base, depth, limit, ua) {
  const seen = new Set(); const out = [];
  async function add(u) {
    if (out.length >= limit || seen.has(u)) return;
    seen.add(u);
    try { out.push(await fetchPage(u, ua)); } catch {}
  }
  await add(base);
  if (depth <= 0) return out;

  // Shallow crawl: pull same-path links from the base page only.
  try {
    const res = await fetch(base, { headers: { "User-Agent": ua || "cf-pages-rss-pages" } });
    if (res.ok) {
      const html = await res.text();
      const rx = /<a\s[^>]*href=["']([^"']+)["'][^>]*>/gi;
      let m; const baseUrl = new URL(base);
      const candidates = [];
      while ((m = rx.exec(html)) && candidates.length < limit * 2) {
        const href = m[1];
        try {
          const abs = new URL(href, baseUrl).toString();
          if (samePath(abs, base) && !abs.includes("#")) candidates.push(abs);
        } catch {}
      }
      for (const u of candidates) {
        if (out.length >= limit) break;
        await add(u);
      }
    }
  } catch {}
  return out;
}

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const base = url.searchParams.get("base");
  if (!base) return new Response("Missing ?base=", { status: 400 });
  const depth = Math.min(parseInt(url.searchParams.get("depth") || "0", 10) || 0, 1);
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "50", 10) || 50, 200);
  const ua = url.searchParams.get("ua") || "";

  const pages = await crawl(base, depth, limit, ua);
  const now = new Date().toUTCString();
  const rssItems = pages.map(p => `
    <item>
      <title>${xmlEscape(p.title)}</title>
      <link>${xmlEscape(p.url)}</link>
      <guid isPermaLink="true">${xmlEscape(p.url)}</guid>
      <pubDate>${p.lastModified}</pubDate>
      <description>${xmlEscape(p.title)}</description>
    </item>`).join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${xmlEscape("Docs Tracker — Pages Feed")}</title>
    <link>${xmlEscape(base)}</link>
    <description>Page changes feed from ${xmlEscape(base)}</description>
    <lastBuildDate>${now}</lastBuildDate>
    <ttl>600</ttl>
    ${rssItems}
  </channel>
</rss>`;
  return new Response(xml, {
    headers: {
      "content-type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=600" // 10 min edge cache
    }
  });
}
