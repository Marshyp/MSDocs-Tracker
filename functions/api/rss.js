// functions/api/rss.js
function xmlEscape(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function isoDaysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - (Number(days) || 14));
  return d.toISOString().slice(0, 10);
}

export async function onRequest(context) {
  const { request, env, waitUntil } = context;
  const url = new URL(request.url);
  const repo = url.searchParams.get("repo");         // required: owner/repo
  const days = url.searchParams.get("days") || "14"; // optional window
  const q    = url.searchParams.get("q") || "";      // optional extra query
  const since = isoDaysAgo(days);
  const token = env.GITHUB_TOKEN || url.searchParams.get("token") || null;

  if (!repo) {
    return new Response("Missing ?repo=owner/repo", { status: 400 });
  }

  // Build GitHub Search query
  const searchQ = `repo:${repo} is:pr is:merged merged:>=${since}${q ? ` ${q}` : ""}`;
  const gh = new URL("https://api.github.com/search/issues");
  gh.searchParams.set("q", searchQ);
  gh.searchParams.set("sort", "updated");
  gh.searchParams.set("order", "desc");
  gh.searchParams.set("per_page", "100");

  // Edge cache
  const cache = caches.default;
  const cacheKey = new Request(gh.toString(), { method: "GET" });
  const cached = await cache.match(cacheKey);
  if (cached) {
    const resp = new Response(cached.body, cached);
    resp.headers.set("content-type", "application/rss+xml; charset=utf-8");
    resp.headers.set("Cache-Control", "public, s-maxage=600"); // 10 min
    return resp;
  }

  // Fetch GitHub
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "cf-pages-change-tracker",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const upstream = await fetch(gh.toString(), { headers });
  if (!upstream.ok) {
    return new Response(
      `GitHub error ${upstream.status}: ${await upstream.text()}`,
      { status: upstream.status }
    );
  }
  const data = await upstream.json();
  const items = Array.isArray(data.items) ? data.items : [];

  // Build RSS 2.0
  const site = `${url.origin}`;
  const title = `MicrosoftDocs Change Tracker — ${repo}`;
  const channelLink = `${site}/?repo=${encodeURIComponent(repo)}`;
  const now = new Date().toUTCString();

  const rssItems = items.map((it) => {
    const merged = it.closed_at || it.merged_at || it.updated_at || new Date().toISOString();
    const filesUrl = `${it.html_url}/files`;
    const desc =
      `<![CDATA[<p>${xmlEscape(it.body || "").slice(0, 1000)}</p>` +
      `<p><strong>Author:</strong> ${xmlEscape(it.user?.login || "unknown")}</p>` +
      `<p><a href="${filesUrl}" target="_blank" rel="noreferrer">View changed files →</a></p>]]>`;

    return `
      <item>
        <title>${xmlEscape(it.title)}</title>
        <link>${filesUrl}</link>
        <guid isPermaLink="false">${xmlEscape(String(it.id))}</guid>
        <pubDate>${new Date(merged).toUTCString()}</pubDate>
        <description>${desc}</description>
      </item>`;
  }).join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${xmlEscape(title)}</title>
    <link>${xmlEscape(channelLink)}</link>
    <description>Merged PRs feed (files tab) for ${xmlEscape(repo)} since ${xmlEscape(since)}</description>
    <lastBuildDate>${now}</lastBuildDate>
    <ttl>600</ttl>
    ${rssItems}
  </channel>
</rss>`;

  const res = new Response(xml, {
    headers: {
      "content-type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=21600" // 6h
    },
  });
  waitUntil(cache.put(cacheKey, res.clone()));
  return res;
}
