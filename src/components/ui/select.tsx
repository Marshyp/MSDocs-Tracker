import * as React from 'react'
import { cn } from './utils'
export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({ className, ...props }, ref) => (
  <select ref={ref} className={cn('rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100', className)} {...props} />
))
Select.displayName = 'Select'
