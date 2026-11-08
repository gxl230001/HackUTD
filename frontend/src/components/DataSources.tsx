import type { DataSource } from '@/lib/api'
import { cn } from '@/lib/utils'

/** Shows which sources feed the numbers, so simulated data is never mistaken for real activity. */
export function DataSources({ sources }: { sources: DataSource[] }) {
  return (
    <ul aria-label="Data sources" className="flex flex-wrap items-center gap-2">
      {sources.map((s) => (
        <li key={s.source} className="flex items-center gap-2 rounded-full bg-card px-3.5 py-2 text-xs text-muted-foreground">
          <span aria-hidden className={cn('size-2 rounded-full', s.status === 'active' ? 'bg-orange' : 'bg-muted-foreground')} />
          {s.label}: <span className="font-semibold text-foreground">{s.status === 'active' ? 'Active' : 'Not connected'}</span>
        </li>
      ))}
    </ul>
  )
}
