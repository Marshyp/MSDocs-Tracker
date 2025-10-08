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

function getToken(): string | null {
  const u = new URL(window.location.href)
  return u.searchParams.get('token')
}

async function fetchJson<T>(url: string, init: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/vnd.github+json', ...(init.headers as any) }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(url, { ...init, headers })
  if (!res.ok) throw new Error(`GitHub ${res.status}: ${url}`)
  return res.json() as Promise<T>
}

export async function searchMergedPRs(repo: string, sinceISO: string, query: string, perPage = 50) {
  const q = `repo:${repo} is:pr is:merged merged:>=${sinceISO}${query ? ` ${query}` : ''}`
  const url = `/api/search?q=${encodeURIComponent(q)}&per_page=${perPage}&since=${sinceISO}`
  try { return await fetchJson<{ items: PRItem[] }>(url) }
  catch { const direct = `https://api.github.com/search/issues?q=${encodeURIComponent(q)}&sort=updated&order=desc&per_page=${perPage}`; return await fetchJson<{ items: PRItem[] }>(direct) }
}

export async function searchReposInOrg(org: string, text: string, perPage = 10) {
  const q = `org:${org} ${text} in:name`
  const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&per_page=${perPage}`
  return fetchJson<{ items: { full_name: string }[] }>(url)
}

export async function getPullFiles(ownerRepo: string, number: number) {
  const url = `https://api.github.com/repos/${ownerRepo}/pulls/${number}/files?per_page=100`
  return fetchJson<any[]>(url)
}

export function toFilesUrl(prHtmlUrl: string) { return `${prHtmlUrl}/files` }
