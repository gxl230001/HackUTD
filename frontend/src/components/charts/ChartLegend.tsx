import { SERIES } from '@/components/charts/series'

export function ChartLegend({ shape = 'line' }: { shape?: 'line' | 'square' }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground" aria-label="Legend">
      {SERIES.map((s) => (
        <li key={s.key} className="flex items-center gap-1.5">
          <span
            aria-hidden
            className={shape === 'line' ? 'h-0.5 w-4 rounded-full' : 'size-2.5 rounded-sm'}
            style={{ background: s.color }}
          />
          {s.label}
        </li>
      ))}
    </ul>
  )
}
