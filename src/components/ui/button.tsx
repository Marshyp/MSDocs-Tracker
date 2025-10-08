import * as React from 'react'
import { cn } from './utils'
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, ...props }, ref) => (
  <button ref={ref} className={cn('inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 font-semibold text-slate-900 hover:border-sky-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100', className)} {...props} />
))
Button.displayName = 'Button'
