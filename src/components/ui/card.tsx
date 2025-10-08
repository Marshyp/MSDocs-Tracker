import * as React from 'react'
import { cn } from './utils'
export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900', className)} {...props} />
}
export function CardTitle(props: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('mb-1 text-[15px] font-semibold leading-tight', props.className)} {...props} />
}
