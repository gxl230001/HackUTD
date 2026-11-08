import type { LucideIcon } from 'lucide-react'

import type { Metric } from '@/lib/api'
import { metricText } from '@/lib/format'
import { cn } from '@/lib/utils'

export type MetricTone = 'exposure' | 'protection' | 'interactions'

/** Tile fill per group. Unavailable metrics use the soft tint so they never read as a real value. */
const TONES: Record<MetricTone, { solid: string; soft: string }> = {
  exposure: { solid: 'bg-lavender', soft: 'bg-lavender-soft' },
  protection: { solid: 'bg-sage', soft: 'bg-sage-soft' },
  interactions: { solid: 'bg-orange', soft: 'bg-orange-soft' },
}

export function MetricCard({ label, metric, detail, icon: Icon, tone, className }: { label: string; metric: Metric; detail?: string | null; icon: LucideIcon; tone: MetricTone; className?: string }) {
  const unavailable = metric.value === null
  return (
    <div className={cn('flex flex-col gap-3 rounded-[28px] p-5 text-foreground', unavailable ? TONES[tone].soft : TONES[tone].solid, className)}>
      <div className="flex items-start justify-between gap-2">
        <span className="text-[13px] leading-4 font-semibold">{label}</span>
        <span className={cn('grid size-8 shrink-0 place-items-center rounded-full', unavailable ? 'bg-card' : 'bg-card/45')}>
          <Icon className="size-4" aria-hidden />
        </span>
      </div>
      <div className={cn('text-4xl leading-none font-bold tabular-nums', unavailable && 'text-base leading-snug font-semibold')}>{metricText(metric)}</div>
      {/* Keep a line of height even when there is no detail so tiles in a row stay level. */}
      <p className="min-h-4 text-xs font-medium">{detail && !unavailable ? detail : ' '}</p>
    </div>
  )
}

export function MetricGroup({ title, description, children, className, gridClassName = 'grid-cols-2' }: {
  title: string
  description: string
  children: React.ReactNode
  className?: string
  gridClassName?: string
}) {
  return (
    <section aria-label={title} className={cn('space-y-3', className)}>
      <div>
        <h2 className="text-base font-semibold">{title}</h2>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div className={cn('grid gap-3', gridClassName)}>{children}</div>
    </section>
  )
}
