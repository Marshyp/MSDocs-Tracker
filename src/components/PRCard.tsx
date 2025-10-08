import React from 'react'
import { toFilesUrl, getPullFiles, PRItem } from '@/lib/github'
import { Card, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'

function labelFromFiles(files: any[]): 'New Docs' | 'Updated Docs' {
  let added=false, modified=false, docs=false
  for (const f of files) {
    const name = (f?.filename || '').toLowerCase()
    if (name.includes('.md') || name.includes('.yml') || name.includes('/docs/') || name.includes('/articles/')) docs = true
    const st = f?.status
    if (st === 'added') added = true
    if (st === 'modified' || st === 'renamed' || st === 'changed') modified = true
  }
  if (!docs) return 'Updated Docs'
  if (added && !modified) return 'New Docs'
  return 'Updated Docs'
}

export function PRCard({ item }: { item: PRItem & { repoName: string } }) {
  const [label, setLabel] = React.useState<string | null>(null)
  React.useEffect(() => { getPullFiles(item.repoName, item.number).then(fs => setLabel(labelFromFiles(fs))).catch(()=>setLabel(null)) }, [item.repoName, item.number])
  const merged = item.closed_at || item.merged_at || item.updated_at
  const filesUrl = toFilesUrl(item.html_url)
  return (
    <Card className="p-4">
      <CardTitle>
  <a
    href={filesUrl}
    target="_blank"
    rel="noreferrer"
    className="text-sky-600 hover:underline dark:text-sky-400"
  >
    {item.title}
  </a>
</CardTitle>
      <div className="mb-2 flex flex-wrap gap-3 text-xs text-slate-400">
        <span>Repo: <span className="rounded border border-blue-200 bg-blue-100 px-1 py-[2px] text-blue-800
           dark:border-slate-700 dark:bg-slate-800/20 dark:text-slate-200">{item.repoName}</span></span>
        {item.user?.login && <span>By <span className="rounded border border-blue-200 bg-blue-100 px-1 py-[2px] text-blue-800
           dark:border-slate-700 dark:bg-slate-800/20 dark:text-slate-200">{item.user.login}</span></span>}
        {merged && <span>Merged: {new Date(merged).toLocaleString()}</span>}
        {label && <Badge>{label}</Badge>}
      </div>
      <p className="mb-3 max-h-40 overflow-hidden whitespace-pre-wrap break-words text-sm opacity-90">
        {(item.body || '').slice(0, 600)}{(item.body || '').length > 600 ? '…' : ''}
      </p>
      <div className="flex items-center gap-2">
        <span className="rounded-full border border-blue-200 bg-blue-100 px-2 py-1 text-xs text-blue-800
           dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-200">{item.repoName}</span>
        <div className="grow" />
        <a
  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 font-semibold text-slate-900 hover:border-sky-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
  href={filesUrl}
  target="_blank"
  rel="noreferrer"
>
  View changed files →
</a>
      </div>
    </Card>
  )
}
