export async function onRequest(context) {
  const { request, env, waitUntil } = context
  const url = new URL(request.url)
  const q = url.searchParams.get("q")
  const per_page = Math.min(parseInt(url.searchParams.get("per_page") || "50", 10) || 50, 100)
  const token = env.GITHUB_TOKEN || url.searchParams.get("token") || null
  if (!q) return new Response(JSON.stringify({ error: "missing q" }), { status: 400, headers: { "content-type": "application/json" } })
  const gh = new URL("https://api.github.com/search/issues")
  gh.searchParams.set("q", q); gh.searchParams.set("sort", "updated"); gh.searchParams.set("order", "desc"); gh.searchParams.set("per_page", String(per_page))
  const cache = caches.default; const cacheKey = new Request(gh.toString(), { method: "GET" })
  let cached = await cache.match(cacheKey)
  if (cached) { const resp = new Response(cached.body, cached); resp.headers.set("Access-Control-Allow-Origin", "*"); resp.headers.set("content-type", "application/json; charset=utf-8"); resp.headers.set("Cache-Control", "public, s-maxage=600"); return resp }
  const headers = { "Accept": "application/vnd.github+json", "User-Agent": "cf-pages-change-tracker" }
  if (token) (headers as any)["Authorization"] = `Bearer ${token}`
  const upstream = await fetch(gh.toString(), { headers })
  const res = new Response(upstream.body, upstream)
  res.headers.set("Access-Control-Allow-Origin", "*"); res.headers.set("content-type", "application/json; charset=utf-8"); res.headers.set("Cache-Control", "public, s-maxage=21600")
  waitUntil(cache.put(cacheKey, res.clone())); return res
}