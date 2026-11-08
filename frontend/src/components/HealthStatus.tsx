import { useApi } from '@/hooks/useApi'
import type { Health } from '@/lib/api'
import { cn } from '@/lib/utils'

/** Small indicator showing whether the frontend can reach the backend and database. */
export function HealthStatus({ className }: { className?: string }) {
  const health = useApi<Health>('/api/health')

  let tone = 'bg-muted-foreground'
  let text = 'Checking server…'
  if (health.status === 'error') {
    tone = 'bg-destructive'
    text = 'Server unreachable'
  } else if (health.status === 'success') {
    const ok = health.data.status === 'ok'
    tone = ok ? 'bg-sage-deep' : 'bg-orange'
    text = ok ? 'Server connected' : `Server up · database ${health.data.database.replace('_', ' ')}`
  }

  return (
    <span role="status" className={cn('inline-flex items-center gap-2 text-xs text-muted-foreground', className)}>
      <span className={cn('size-2 rounded-full', tone)} aria-hidden />
      {text}
    </span>
  )
}
