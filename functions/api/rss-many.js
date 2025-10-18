// /api/rss-many?repos=owner1/repo1,owner2/repo2&days=14[&q=...]
function xmlEscape(s){return String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&apos;");}
function isoDaysAgo(days){const d=new Date();d.setDate(d.getDate()-(Number(days)||14));return d.toISOString().slice(0,10);}
async function ghSearch(q, perPage, token){
  const u = new URL("https://api.github.com/search/issues");
  u.searchParams.set("q", q); u.searchParams.set("sort","updated"); u.searchParams.set("order","desc"); u.searchParams.set("per_page", String(perPage||100));
  const headers = { Accept:"application/vnd.github+json", "User-Agent":"cf-pages-rss-many" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const r = await fetch(u.toString(), { headers }); if (!r.ok) throw new Error(`GitHub ${r.status}`);
  return r.json();
}
export async function onRequest(context){
  const { request, env } = context;
  const url = new URL(request.url);
  const reposParam = url.searchParams.get("repos") || "";
  const days = url.searchParams.get("days") || "14";
  const qExtra = url.searchParams.get("q") || "";
  const since = isoDaysAgo(days);
  const token = env.GITHUB_TOKEN || url.searchParams.get("token") || null;

  const repos = reposParam.split(",").map(s=>s.trim()).filter(Boolean);
  if (!repos.length) return new Response("Missing ?repos=a/b,c/d", { status: 400 });

  const repoExpr = repos.map(r => `repo:${r}`).join(" OR ");
  const q = `(${repoExpr}) is:pr is:merged merged:>=${since}${qExtra ? ` ${qExtra}` : ""}`;

  // Edge cache
  const cache = caches.default; const key = new Request("https://rss-many.local/?q="+encodeURIComponent(q));
  const cached = await cache.match(key);
  if (cached) return new Response(cached.body, { headers: { "content-type":"application/rss+xml; charset=utf-8", "Cache-Control":"public, s-maxage=600" } });

  const data = await ghSearch(q, 100, token);
  const items = Array.isArray(data.items) ? data.items : [];
  // Sort by merged/updated desc
  items.sort((a,b)=>{
    const ta = Date.parse(a.closed_at || a.merged_at || a.updated_at || 0);
    const tb = Date.parse(b.closed_at || b.merged_at || b.updated_at || 0);
    return tb - ta;
  });

  const now = new Date().toUTCString();
  const xmlItems = items.map(it=>{
    const merged = it.closed_at || it.merged_at || it.updated_at || new Date().toISOString();
    const filesUrl = `${it.html_url}/files`;
    const title = it.title || "Merged PR";
    return `
      <item>
        <title>${xmlEscape(title)}</title>
        <link>${filesUrl}</link>
        <guid isPermaLink="false">${xmlEscape(String(it.id))}</guid>
        <pubDate>${new Date(merged).toUTCString()}</pubDate>
        <description><![CDATA[<p>${xmlEscape(it.body||"").slice(0,1000)}</p><p><a href="${filesUrl}">View changed files →</a></p>]]></description>
      </item>`;
  }).join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${xmlEscape("Docs Tracker — Combined Repos")}</title>
    <link>${xmlEscape(url.origin)}</link>
    <description>Merged PRs across: ${xmlEscape(repos.join(", "))} (since ${since})</description>
    <lastBuildDate>${now}</lastBuildDate>
    <ttl>600</ttl>
    ${xmlItems}
  </channel>
</rss>`;

  const res = new Response(xml, { headers: { "content-type":"application/rss+xml; charset=utf-8", "Cache-Control":"public, s-maxage=21600" } });
  await cache.put(key, res.clone()); return res;
}
