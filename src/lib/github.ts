export type PRItem = {
  id: number
  number: number
  title: string
  html_url: string
  repository_url: string
  merged_at?: string
  closed_at?: string
  updated_at?: string
  user?: { login?: string }
  body?: string
}

export type MultiRepoError = { repo: string; message: string }
export type MultiResult = { items: PRItem[]; errors: MultiRepoError[] }

function getToken(): string | null {
  try {
    const u = new URL(window.location.href)
    return u.searchParams.get('token')
  } catch {
    return null
  }
}

async function fetchJson<T>(url: string, init: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    ...(init.headers as any),
  }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(url, { ...init, headers })
  if (!res.ok) throw new Error(`GitHub ${res.status}: ${url}`)
  return res.json() as Promise<T>
}

export async function searchMergedPRs(
  repo: string,
  sinceISO: string,
  query: string,
  perPage = 50
) {
  const q = `repo:${repo} is:pr is:merged merged:>=${sinceISO}${query ? ` ${query}` : ''}`
  const edge = `/api/search?q=${encodeURIComponent(q)}&per_page=${perPage}&since=${sinceISO}`

  try {
    return await fetchJson<{ items: PRItem[] }>(edge)
  } catch {
    const direct = `https://api.github.com/search/issues?q=${encodeURIComponent(
      q
    )}&sort=updated&order=desc&per_page=${perPage}`
    return await fetchJson<{ items: PRItem[] }>(direct)
  }
}

export async function searchMergedPRsMulti(
  repos: string[],
  sinceISO: string,
  query: string,
  perRepo = 50
): Promise<MultiResult> {
  const uniq = Array.from(new Set(repos.map(r => r.trim()).filter(Boolean)))
  if (!uniq.length) return { items: [], errors: [] }

  const errors: MultiRepoError[] = []

  const results = await Promise.all(
    uniq.map(async (r) => {
      try {
        const rres = await searchMergedPRs(r, sinceISO, query, perRepo)
        return rres.items || []
      } catch (e: any) {
        errors.push({ repo: r, message: e?.message ?? String(e) })
        return []
      }
    })
  )

  const seen = new Set<number>()
  const merged: PRItem[] = []
  for (const arr of results) {
    for (const it of arr) {
      if (!seen.has(it.id)) {
        seen.add(it.id)
        merged.push(it)
      }
    }
  }

  merged.sort((a, b) => {
    const ta = Date.parse(a.closed_at || a.merged_at || a.updated_at || '')
    const tb = Date.parse(b.closed_at || b.merged_at || b.updated_at || '')
    return (isNaN(tb) ? 0 : tb) - (isNaN(ta) ? 0 : ta)
  })

  return { items: merged, errors }
}

export async function searchReposInOrg(org: string, text: string, perPage = 10) {
  const q = `org:${org} ${text} in:name`
  const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&per_page=${perPage}`
  return fetchJson<{ items: { full_name: string }[] }>(url)
}

export async function getPullFiles(ownerRepo: string, number: number) {
  // Use our own Cloudflare function (cached, token-aware)
  const params = new URLSearchParams({ repo: ownerRepo, pr: String(number) });
  // Allow ?token=... in the page URL to be forwarded if present (optional)
  try {
    const token = new URL(window.location.href).searchParams.get('token');
    if (token) params.set('token', token);
  } catch {}

  const edgeUrl = `/api/files?${params.toString()}`;
  try {
    const res = await fetch(edgeUrl, { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`Edge ${res.status}`);
    return (await res.json()) as any[];
  } catch {
    // Fallback directly to GitHub (last resort)
    const direct = `https://api.github.com/repos/${ownerRepo}/pulls/${number}/files?per_page=100`;
    const r = await fetch(direct, {
      headers: { Accept: 'application/vnd.github+json' },
    });
    if (!r.ok) throw new Error(`GitHub ${r.status}`);
    return (await r.json()) as any[];
  }
}


export function toFilesUrl(prHtmlUrl: string) {
  return `${prHtmlUrl}/files`
}
