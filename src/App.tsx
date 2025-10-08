import React from 'react'
import { ThemeToggle } from '@/components/ThemeToggle'
import { RepoPicker } from '@/components/RepoPicker'
import { PRCard } from '@/components/PRCard'
import { searchMergedPRs, PRItem } from '@/lib/github'

export default function App() {
  const [repo, setRepo] = React.useState<string>(() => localStorage.getItem('repo') || 'MicrosoftDocs/defender-docs')
  const [daysBack, setDaysBack] = React.useState<number>(() => Number(localStorage.getItem('daysBack')) || 14)
  const [query, setQuery] = React.useState<string>(() => localStorage.getItem('query') || '')
  const [loading, setLoading] = React.useState(false)
  const [items, setItems] = React.useState<(PRItem & { repoName: string })[]>([])
  const [error, setError] = React.useState<string>('')

  const sinceISO = React.useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() - (daysBack || 14))
    return d.toISOString().slice(0, 10)
  }, [daysBack])

  React.useEffect(() => { localStorage.setItem('repo', repo) }, [repo])
  React.useEffect(() => { localStorage.setItem('daysBack', String(daysBack)) }, [daysBack])
  React.useEffect(() => { localStorage.setItem('query', query) }, [query])

  async function load() {
    if (!repo) return
    setLoading(true); setError('')
    try {
      const data = await searchMergedPRs(repo, sinceISO, query, 50)
      const arr = (data?.items ?? [])
        .map(it => ({ ...it, repoName: (it.repository_url || '').replace('https://api.github.com/repos/', '') }))
        .filter(it => it.repoName.toLowerCase() === repo.toLowerCase()) // safety hard filter
      setItems(arr)
    } catch (e: any) {
      setError(e?.message ?? String(e))
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => { load() }, [repo, sinceISO, query])

  return (
    <div className="container mx-auto px-4 py-6">
      <header className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">MicrosoftDocs Change Tracker</h1>
          <h2 className="text-2xl font-bold tracking-tight">Bought to you by <a href="https://marshsecurity.org/">Marsh Security</a></h2>
          <p className="mt-1 text-sm text-slate-400">
            Pick a repository, then browse recently merged PRs. Fast, minimal, and cached on Cloudflare.
          </p>
        </div>
        <ThemeToggle />
      </header>

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
        <div className="ml-auto text-xs text-slate-400">
          Showing <code className="rounded bg-slate-800/20 px-1 py-[2px]">repo:{repo} merged:&gt;={sinceISO}</code>
        </div>
      </div>

      {error && (
        <div className="mb-3 rounded-xl border border-red-400/50 bg-red-500/10 p-3 text-sm">
          GitHub API error: {error}
        </div>
      )}

      <div className="grid grid-cols-[repeat(auto-fill,minmax(290px,1fr))] gap-3">
        {items.map(it => (
          <PRCard key={it.id} item={it} />
        ))}
      </div>
    </div>
  )
}
