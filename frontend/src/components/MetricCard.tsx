import type { LucideIcon } from 'lucide-react'

import { Card } from '@/components/ui/card'
import type { Metric } from '@/lib/api'
import { metricText } from '@/lib/format'
import { cn } from '@/lib/utils'

export function MetricCard({ label, metric, detail, icon: Icon }: { label: string; metric: Metric; detail?: string | null; icon: LucideIcon }) {
  const unavailable = metric.value === null
  return (
    <Card size="sm" className="gap-1 px-4">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <Icon className="size-3.5" aria-hidden />
        {label}
      </div>
      <div className={cn('text-2xl font-semibold tabular-nums', unavailable && 'text-base font-medium text-muted-foreground')}>
        {metricText(metric)}
      </div>
      {detail && !unavailable && <p className="text-xs text-muted-foreground">{detail}</p>}
    </Card>
  )
}

export function MetricGroup({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section aria-label={title} className="space-y-2">
      <div>
        <h2 className="text-sm font-semibold">{title}</h2>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">{children}</div>
    </section>
  )
}
