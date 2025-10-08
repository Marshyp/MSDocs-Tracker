import React from 'react'
import { Moon, Sun } from 'lucide-react'
import { Button } from './ui/button'
export function ThemeToggle() {
  const [dark, setDark] = React.useState(() => document.documentElement.classList.contains('dark'))
  React.useEffect(() => { document.documentElement.classList.toggle('dark', dark); localStorage.setItem('theme', dark ? 'dark' : 'light') }, [dark])
  React.useEffect(() => { const saved = localStorage.getItem('theme'); if (saved) setDark(saved === 'dark'); else setDark(true) }, [])
  return <Button onClick={() => setDark(v => !v)} aria-label="Toggle theme">{dark ? <Moon size={16}/> : <Sun size={16}/>} {dark ? 'Dark' : 'Light'}</Button>
}
