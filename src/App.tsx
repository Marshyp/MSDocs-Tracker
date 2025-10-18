// src/App.tsx
import React from 'react'
import { ThemeToggle } from '@/components/ThemeToggle'
import { RepoPicker } from '@/components/RepoPicker'
import { PRCard } from '@/components/PRCard'
import { searchMergedPRs, searchMergedPRsMulti, PRItem, MultiRepoError } from '@/lib/github'

export default function App() {
  const [repo, setRepo] = React.useState<string>(() => localStorage.getItem('repo') || 'MicrosoftDocs/defender-docs')
  const [daysBack, setDaysBack] = React.useState<number>(() => Number(localStorage.getItem('daysBack')) || 14)
  const [query, setQuery] = React.useState<string>(() => localStorage.getItem('query') || '')

  const [extraRepos, setExtraRepos] = React.useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('extraRepos') || '[]') } catch { return [] }
  })

  const [loading, setLoading] = React.useState(false)
  const [items, setItems] = React.useState<(PRItem & { repoName: string })[]>([])
  const [error, setError] = React.useState<string>('')
  const [multiErrors, setMultiErrors] = React.useState<MultiRepoError[]>([])

  const sinceISO = React.useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() - (daysBack || 14))
    return d.toISOString().slice(0, 10)
  }, [daysBack])

  React.useEffect(() => { localStorage.setItem('repo', repo) }, [repo])
  React.useEffect(() => { localStorage.setItem('daysBack', String(daysBack)) }, [daysBack])
  React.useEffect(() => { localStorage.setItem('query', query) }, [query])
  React.useEffect(() => { localStorage.setItem('extraRepos', JSON.stringify(extraRepos)) }, [extraRepos])

  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const rssUrl = React.useMemo(() => {
    const params = new URLSearchParams({ repo, days: String(daysBack) })
    if (query) params.set('q', query)
    return `${origin}/api/rss?${params.toString()}`
  }, [origin, repo, daysBack, query])

  const combinedRssUrl = React.useMemo(() => {
    const all = extraRepos.length ? Array.from(new Set([repo, ...extraRepos])) : []
    if (!all.length) return ''
    const params = new URLSearchParams({ repos: all.join(','), days: String(daysBack) })
    if (query) params.set('q', query)
    return `${origin}/api/rss-many?${params.toString()}`
  }, [origin, repo, extraRepos, daysBack, query])

  const purviewRssUrl = React.useMemo(() => {
    const params = new URLSearchParams({ base: 'https://learn.microsoft.com/en-us/purview/', depth: '1', limit: '60' })
    return `${origin}/api/rss-pages?${params.toString()}`
  }, [origin])

  function addCurrentRepo() {
    setExtraRepos(prev => (prev.includes(repo) ? prev : [...prev, repo]))
  }
  function removeExtra(r: string) {
    setExtraRepos(prev => prev.filter(x => x !== r))
  }

  async function load() {
    const all = extraRepos.length ? Array.from(new Set([repo, ...extraRepos])) : [repo]
    setLoading(true); setError(''); setMultiErrors([])

    try {
      if (all.length === 1) {
        const data = await searchMergedPRs(repo, sinceISO, query, 50)
        const arr = (data?.items ?? []).map(it => ({
          ...it,
          repoName: (it.repository_url || '').replace('https://api.github.com/repos/', ''),
        }))
        setItems(arr.filter(it => it.repoName.toLowerCase() === repo.toLowerCase()))
      } else {
        const data = await searchMergedPRsMulti(all, sinceISO, query, 50)
        const arr = (data?.items ?? []).map(it => ({
          ...it,
          repoName: (it.repository_url || '').replace('https://api.github.com/repos/', ''),
        }))
        setItems(arr.filter(it => all.some(r => r.toLowerCase() === it.repoName.toLowerCase())))
        setMultiErrors(data.errors || [])
      }
    } catch (e: any) {
      setError(e?.message ?? String(e))
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => { load() }, [repo, sinceISO, query, extraRepos])

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <header className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">MicrosoftDocs Change Tracker</h1>
          <p className="mt-1 text-sm">
            <span className="opacity-80">Brought to you by </span>
            <a href="https://marshsecurity.org/" target="_blank" rel="noreferrer" className="font-medium text-sky-600 hover:underline dark:text-sky-400">
              Marsh Security
            </a>
          </p>
          <p className="mt-1 text-sm text-slate-400">
            Pick a repository, then browse recently merged PRs. Fast, minimal, and cached on Cloudflare.
          </p>
        </div>
        <ThemeToggle />
      </header>

      {/* Toolbar */}
      <div className="mb-2 flex flex-wrap items-center gap-3">
        <RepoPicker value={repo} onChange={setRepo} />

        <input
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          placeholder="Search PR titles/bodies…"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />

        <select
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          value={daysBack}
          onChange={e => setDaysBack(Number(e.target.value))}
        >
          {[7, 14, 30, 60, 90].map(d => (
            <option key={d} value={d}>Last {d} days</option>
          ))}
        </select>

        <button
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 font-semibold text-slate-900 hover:border-sky-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          onClick={load}
          disabled={loading}
        >
          {loading ? 'Loading…' : 'Refresh'}
        </button>

        {/* Combine controls */}
        <div className="flex items-center gap-2">
          <button
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 hover:border-sky-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            onClick={addCurrentRepo}
            title="Add the currently selected repo to the combined set"
          >
            + Combine
          </button>
          {extraRepos.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {extraRepos.map(r => (
                <span key={r} className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-100 px-2 py-0.5 text-xs text-blue-800 dark:border-slate-700 dark:bg-slate-800/30 dark:text-slate-200">
                  {r}
                  <button className="ml-1 rounded bg-transparent px-1 text-xs" onClick={() => removeExtra(r)} aria-label={`Remove ${r}`} title="Remove">✕</button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Right: Showing + RSS */}
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <span
            className="inline-flex h-8 items-center rounded-md border border-slate-700/20 bg-slate-800/5 px-2 text-xs text-slate-500 dark:border-slate-700/40 dark:bg-slate-800/30 dark:text-slate-400 whitespace-nowrap"
            title={`repo(s) merged:>=${sinceISO}`}
          >
            Showing&nbsp;
            <code className="rounded bg-slate-800/10 px-1 py-[2px] dark:bg-slate-800/30">
              {extraRepos.length ? `combined(${[repo, ...extraRepos].join(', ')})` : `repo:${repo}`} merged:&gt;={sinceISO}
            </code>
          </span>

          <a
            className="inline-flex h-8 items-center rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-900 hover:border-sky-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            href={rssUrl}
            target="_blank"
            rel="noreferrer"
          >
            RSS Feed
          </a>

          {combinedRssUrl && (
            <a
              className="inline-flex h-8 items-center rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-900 hover:border-sky-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              href={combinedRssUrl}
              target="_blank"
              rel="noreferrer"
              title="Combined repositories RSS"
            >
              Combined RSS
            </a>
          )}

          <a
            className="inline-flex h-8 items-center rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-900 hover:border-sky-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            href={purviewRssUrl}
            target="_blank"
            rel="noreferrer"
            title="Purview docs (learn.microsoft.com) RSS"
          >
            Purview RSS
          </a>
        </div>
      </div>

      {/* Error from overall request */}
      {error && (
        <div className="mb-3 rounded-xl border border-red-400/50 bg-red-500/10 p-3 text-sm">
          GitHub API error: {error}
        </div>
      )}

      {/* Partial errors from combined search */}
      {multiErrors.length > 0 && (
        <div className="mb-3 rounded-xl border border-amber-400/60 bg-amber-500/10 p-3 text-sm">
          <div className="font-semibold">Some repositories could not be fetched:</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {multiErrors.map((e) => (
              <span key={e.repo} className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-100 px-2 py-0.5 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-900/30 dark:text-amber-200" title={e.message}>
                {e.repo}
              </span>
            ))}
          </div>
          <div className="mt-2 text-xs opacity-80">Showing results from the remaining repositories.</div>
        </div>
      )}

      {/* Cards grid */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(290px,1fr))] gap-3">
        {items.map(it => (
          <PRCard key={it.id} item={it} />
        ))}
      </div>

      {/* Footer */}
      <footer className="mt-8 text-sm text-slate-400">
        Follow my Security blog:{' '}
        <a href="https://marshsecurity.org/" target="_blank" rel="noreferrer" className="text-sky-600 hover:underline dark:text-sky-400">
          Marsh Security
        </a>
      </footer>
    </div>
  )
}
