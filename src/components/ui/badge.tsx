import * as React from 'react'
import { cn } from './utils'
export function Badge({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn('inline-flex items-center rounded-full border border-slate-200 bg-sky-100 px-2 py-0.5 text-xs text-sky-800 dark:border-slate-700 dark:bg-sky-900/30 dark:text-sky-200', className)} {...props} />
}
