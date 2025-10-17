import React from 'react'
import { Select } from './ui/select'

const OPTIONS = [
  'MicrosoftDocs/defender-docs',
  'MicrosoftDocs/entra-docs',
  'MicrosoftDocs/microsoft-365-docs',
  'MicrosoftDocs/azure-docs',
  'MicrosoftDocs/msteams-docs',
  'MicrosoftDocs/windows-itpro-docs',
  'MicrosoftDocs/windowsserverdocs',
  'MicrosoftDocs/memdocs',
  'MicrosoftDocs/azure-docs-cli',
  'MicrosoftDocs/win32',
  'MicrosoftDocs/edge-developer',
  'MicrosoftDocs/dataexplorer-docs',
  // add any other frequent repos here
]

export function RepoPicker({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  const options = React.useMemo(() => OPTIONS, [])

  return (
    <div className="w-[340px]">
      <Select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Select repository"
        className="text-sm"
      >
        {options.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
        {!options.includes(value) && <option value={value}>{value}</option>}
      </Select>
    </div>
  )
}
