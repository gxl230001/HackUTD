import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router'

import { SERIES } from '@/components/charts/series'
import type { MemberMetrics, Member, Period } from '@/lib/api'
import { UNAVAILABLE } from '@/lib/format'

type Row = { member: Member; metrics: MemberMetrics }

/**
 * Per-member exposure vs. interactions as thin horizontal bars on one shared
 * scale, with the numbers printed beside each bar (the table is the chart).
 */
export function MemberComparison({ rows, period }: { rows: Row[]; period: Period }) {
  const max = Math.max(1, ...rows.flatMap(({ metrics }) => SERIES.map((s) => metrics[s.key].value ?? 0)))

  if (rows.length === 0) return <p className="text-sm text-muted-foreground">No family members yet.</p>

  return (
    <ul className="divide-y">
      {rows.map(({ member, metrics }) => (
        <li key={member.id}>
          <Link to={`/members/${member.id}?period=${period}`} className="group block rounded-lg px-1 py-3 transition-colors hover:bg-muted/60">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium">{member.display_name}</span>
              <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden />
            </div>
            <dl className="space-y-1.5">
              {SERIES.map((s) => {
                const value = metrics[s.key].value
                return (
                  <div key={s.key} className="grid grid-cols-[8.5rem_1fr_2.5rem] items-center gap-2 text-xs">
                    <dt className="text-muted-foreground">{s.label}</dt>
                    <dd className="h-2 rounded-full bg-muted" aria-hidden>
                      {value !== null && value > 0 && (
                        <div className="h-2 rounded-full" style={{ width: `${(value / max) * 100}%`, background: s.color }} />
                      )}
                    </dd>
                    <dd className="text-right font-medium tabular-nums">{value === null ? <span title={UNAVAILABLE}>—</span> : value}</dd>
                  </div>
                )
              })}
            </dl>
          </Link>
        </li>
      ))}
    </ul>
  )
}
