import { SERIES } from '@/components/charts/series'

export function ChartLegend() {
  return (
    <ul className="flex flex-wrap gap-2 text-xs" aria-label="Legend">
      {SERIES.map((s) => (
        <li key={s.key} className="flex items-center gap-2 rounded-full bg-surface-soft px-3 py-1.5 font-medium">
          <span aria-hidden className="size-2.5 rounded-full" style={{ background: s.color }} />
          {s.label}
        </li>
      ))}
    </ul>
  )
}
