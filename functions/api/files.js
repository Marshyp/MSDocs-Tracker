// Usage: /api/files?repo=owner/repo&pr=123
// Optional: ?per_page=100, ?token=... (falls back to env.GITHUB_TOKEN)

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const repo = url.searchParams.get("repo") || "";
  const pr = url.searchParams.get("pr") || "";
  const perPage = Math.min(parseInt(url.searchParams.get("per_page") || "100", 10) || 100, 100);
  const token = url.searchParams.get("token") || env.GITHUB_TOKEN || "";

  if (!repo || !pr) {
    return new Response(JSON.stringify({ error: "Missing repo or pr" }), {
      status: 400,
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  }

  const gh = new URL(`https://api.github.com/repos/${repo}/pulls/${pr}/files`);
  gh.searchParams.set("per_page", String(perPage));

  // Edge cache key
  const cache = caches.default;
  const cacheKey = new Request(gh.toString(), { method: "GET" });

  // Serve cached if present
  const cached = await cache.match(cacheKey);
  if (cached) {
    return new Response(cached.body, {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "Cache-Control": "public, s-maxage=3600", // 1 hour
      },
    });
  }

  // Fetch from GitHub with token if provided
  const headers = {
    "Accept": "application/vnd.github+json",
    "User-Agent": "cf-pages-docs-tracker",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(gh.toString(), { headers });
  if (!res.ok) {
    // Return error JSON but still allow the client to gracefully fallback
    return new Response(JSON.stringify({ error: `GitHub ${res.status}` }), {
      status: res.status,
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  }

  const body = await res.text(); // store as text for cache re-use
  const out = new Response(body, {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600",
    },
  });
  await cache.put(cacheKey, out.clone());
  return out;
}
