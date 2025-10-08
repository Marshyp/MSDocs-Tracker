import React from 'react'
import { searchReposInOrg } from '@/lib/github'
import { Input } from './ui/input'
import { Select } from './ui/select'
import { Button } from './ui/button'

const DEFAULTS = [
  'MicrosoftDocs/defender-docs',
  'MicrosoftDocs/microsoft-365-docs',
  'MicrosoftDocs/azure-docs',
  'MicrosoftDocs/msteams-docs',
  'MicrosoftDocs/windows-itpro-docs',
  'MicrosoftDocs/windowsserverdocs',
  'MicrosoftDocs/memdocs',
]

export function RepoPicker({ value, onChange }:{ value: string, onChange: (v:string)=>void }) {
  const [text, setText] = React.useState(value)
  const [results, setResults] = React.useState<string[]>(DEFAULTS)
  const [loading, setLoading] = React.useState(false)
  const timer = React.useRef<number | null>(null)

  React.useEffect(() => { setText(value) }, [value])

  function schedule(q: string) {
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(async () => {
      if (!q) { setResults(DEFAULTS); return }
      try {
        setLoading(true)
        const res = await searchReposInOrg('MicrosoftDocs', q, 10)
        const names = res.items.map(it => it.full_name)
        setResults(names.length ? names : DEFAULTS)
      } finally { setLoading(false) }
    }, 250)
  }

  return (
    <div className="relative w-[420px]">
      <div className="flex gap-2">
        <Select value={value} onChange={e=>onChange(e.target.value)}>
          {results.map(r => <option key={r} value={r}>{r}</option>)}
          {!results.includes(value) && <option value={value}>{value}</option>}
        </Select>
        <Input placeholder="Type to search… e.g. msteams-docs" value={text} onChange={e => { setText(e.target.value); schedule(e.target.value) }} />
        <Button onClick={() => onChange(text.trim())} disabled={!text.trim()}>Use</Button>
      </div>
      {loading && <div className="absolute right-2 top-2 text-xs text-slate-400">searching…</div>}
    </div>
  )
}
