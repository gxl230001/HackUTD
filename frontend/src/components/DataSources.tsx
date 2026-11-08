import { Database } from 'lucide-react'

import type { DataSource } from '@/lib/api'
import { cn } from '@/lib/utils'

/** Shows which sources feed the numbers, so simulated data is never mistaken for real activity. */
export function DataSources({ sources }: { sources: DataSource[] }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
      <span className="flex items-center gap-1.5 font-medium">
        <Database className="size-3.5" aria-hidden /> Data sources
      </span>
      {sources.map((s) => (
        <span key={s.source} className="flex items-center gap-1.5">
          <span aria-hidden className={cn('size-1.5 rounded-full', s.status === 'active' ? 'bg-amber-500' : 'bg-muted-foreground/40')} />
          {s.label}: <span className="font-medium text-foreground">{s.status === 'active' ? 'Active' : 'Not connected'}</span>
        </span>
      ))}
    </div>
  )
}
