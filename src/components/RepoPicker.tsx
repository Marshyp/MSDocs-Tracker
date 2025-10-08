import React from 'react'
import { searchReposInOrg } from '@/lib/github'
import { Select } from './ui/select'

const DEFAULTS = [
  'MicrosoftDocs/defender-docs',
  'MicrosoftDocs/microsoft-365-docs',
  'MicrosoftDocs/azure-docs',
  'MicrosoftDocs/msteams-docs',
  'MicrosoftDocs/windows-itpro-docs',
  'MicrosoftDocs/windowsserverdocs',
  'MicrosoftDocs/memdocs',
]

export function RepoPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [results, setResults] = React.useState<string[]>(DEFAULTS)
  const [loading, setLoading] = React.useState(false)
  const [search, setSearch] = React.useState('')
  const timer = React.useRef<number | null>(null)

  // Debounced live search of MicrosoftDocs org
  function scheduleSearch(q: string) {
    setSearch(q)
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(async () => {
      if (!q) {
        setResults(DEFAULTS)
        return
      }
      try {
        setLoading(true)
        const res = await searchReposInOrg('MicrosoftDocs', q, 10)
        const names = res.items.map(it => it.full_name)
        setResults(names.length ? names : DEFAULTS)
      } catch {
        setResults(DEFAULTS)
      } finally {
        setLoading(false)
      }
    }, 300)
  }

  return (
    <div className="relative w-[320px]">
      <Select
        value={value}
        onChange={e => onChange(e.target.value)}
        onInput={e => scheduleSearch((e.target as HTMLSelectElement).value)}
        aria-label="Select repository"
      >
        {results.map(r => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
        {!results.includes(value) && <option value={value}>{value}</option>}
      </Select>
      {loading && (
        <div className="absolute right-2 top-2 text-xs text-slate-400">searching…</div>
      )}
    </div>
  )
}
