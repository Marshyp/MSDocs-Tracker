// functions/api/search.js
export async function onRequest(context) {
  const { request, env, waitUntil } = context;
  const url = new URL(request.url);
  const since = url.searchParams.get("since");
  const q = url.searchParams.get("q") || "";
  const per_page = Math.min(parseInt(url.searchParams.get("per_page") || "100", 10) || 100, 100);
  const userToken = url.searchParams.get("token");
  const token = env.GITHUB_TOKEN || userToken || null;

  if (!since) {
    return new Response(JSON.stringify({ error: "missing 'since' (YYYY-MM-DD)" }), { status: 400, headers: { "content-type": "application/json" } });
  }

  const ghQuery = `org:MicrosoftDocs is:pr is:merged merged:>=${since}${q ? " " + q : ""}`;
  const ghUrl = new URL("https://api.github.com/search/issues");
  ghUrl.searchParams.set("q", ghQuery);
  ghUrl.searchParams.set("sort", "updated");
  ghUrl.searchParams.set("order", "desc");
  ghUrl.searchParams.set("per_page", String(per_page));

  const cache = caches.default;
  const cacheKey = new Request(ghUrl.toString(), { method: "GET" });
  let cached = await cache.match(cacheKey);
  if (cached) {
    cached = new Response(cached.body, cached);
    cached.headers.set("Access-Control-Allow-Origin", "*");
    cached.headers.set("Cache-Control", "public, s-maxage=600");
    cached.headers.set("content-type", "application/json; charset=utf-8");

    if (token) {
      waitUntil((async () => {
        try {
          const fresh = await fetch(ghUrl.toString(), {
            headers: {
              "Accept": "application/vnd.github+json",
              "Authorization": `Bearer ${token}`,
              "User-Agent": "cf-pages-change-tracker",
            },
          });
          if (fresh.ok) {
            const res = new Response(fresh.body, fresh);
            res.headers.set("Cache-Control", "public, s-maxage=21600"); // 6h
            await cache.put(cacheKey, res.clone());
          }
        } catch (e) {}
      })());
    }
    return cached;
  }

  const headers = {
    "Accept": "application/vnd.github+json",
    "User-Agent": "cf-pages-change-tracker",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const resp = await fetch(ghUrl.toString(), { headers });
  if (!resp.ok) {
    const text = await resp.text();
    return new Response(text || JSON.stringify({ error: "GitHub API error", status: resp.status }), {
      status: resp.status,
      headers: { "content-type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }

  const res = new Response(resp.body, resp);
  res.headers.set("Cache-Control", "public, s-maxage=21600"); // 6h
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("content-type", "application/json; charset=utf-8");
  await cache.put(cacheKey, res.clone());
  return res;
}
