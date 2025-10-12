import React from 'react'
import { toFilesUrl, getPullFiles, PRItem } from '@/lib/github'
import { Card, CardTitle } from './ui/card'

type LabelKind = 'new' | 'updated'

function computeLabelKind(files: any[]): LabelKind {
  // If any file was ADDED in this PR, treat as "New docs"
  if (Array.isArray(files) && files.some(f => String(f?.status).toLowerCase() === 'added')) {
    return 'new'
  }
  // Otherwise treat as "Updated docs"
  return 'updated'
}

function labelClasses(kind: LabelKind) {
  // Green for 'new', Blue for 'updated'
  return kind === 'new'
    ? 'inline-flex items-center rounded-full border border-green-200 bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:border-green-900/50 dark:bg-green-900/30 dark:text-green-200'
    : 'inline-flex items-center rounded-full border border-blue-200 bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:border-sky-900/50 dark:bg-sky-900/30 dark:text-sky-200'
}

function labelText(kind: LabelKind) {
  return kind === 'new' ? 'New docs' : 'Updated docs'
}

export function PRCard({ item }: { item: PRItem & { repoName: string } }) {
  const [labelKind, setLabelKind] = React.useState<LabelKind>('updated')

  React.useEffect(() => {
    // Lazy-load files for this PR and compute the label.
    // If the request fails (rate limit/network), fall back to "updated".
    getPullFiles(item.repoName, item.number)
      .then(files => setLabelKind(computeLabelKind(files)))
      .catch(() => setLabelKind('updated'))
  }, [item.repoName, item.number])

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

      <div className="mb-2 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
        <span>
          Repo:{' '}
          <span className="rounded border border-blue-200 bg-blue-100 px-1 py-[2px] text-blue-800 dark:border-slate-700 dark:bg-slate-800/20 dark:text-slate-200">
            {item.repoName}
          </span>
        </span>

        {item.user?.login && (
          <span>
            By{' '}
            <span className="rounded border border-blue-200 bg-blue-100 px-1 py-[2px] text-blue-800 dark:border-slate-700 dark:bg-slate-800/20 dark:text-slate-200">
              {item.user.login}
            </span>
          </span>
        )}

        {merged && <span>Merged: {new Date(merged).toLocaleString()}</span>}

        {/* Always show a label (green when any file added, blue otherwise) */}
        <span className={labelClasses(labelKind)}>{labelText(labelKind)}</span>
      </div>

      <p className="mb-3 max-h-40 overflow-hidden whitespace-pre-wrap break-words text-sm opacity-90">
        {(item.body || '').slice(0, 600)}
        {(item.body || '').length > 600 ? '…' : ''}
      </p>

      <div className="flex items-center gap-2">
        <span className="rounded-full border border-blue-200 bg-blue-100 px-2 py-1 text-xs text-blue-800 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-200">
          {item.repoName}
        </span>
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
