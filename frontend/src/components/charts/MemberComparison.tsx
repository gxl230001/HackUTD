import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router'

import { SERIES } from '@/components/charts/series'
import { MemberAvatar } from '@/components/MemberAvatar'
import type { MemberMetrics, Member, Period } from '@/lib/api'
import { UNAVAILABLE } from '@/lib/format'

type Row = { member: Member; metrics: MemberMetrics }

/**
 * Per-member exposure vs. interactions as horizontal bars on one shared
 * scale, with the numbers printed beside each bar (the table is the chart).
 * Bar colors match the metric tiles: lavender exposure, sage blocked, orange interactions.
 */
export function MemberComparison({ rows, period }: { rows: Row[]; period: Period }) {
  const max = Math.max(1, ...rows.flatMap(({ metrics }) => SERIES.map((s) => metrics[s.key].value ?? 0)))

  if (rows.length === 0) return <p className="text-sm text-muted-foreground">No family members yet.</p>

  return (
    <ul className="space-y-3">
      {rows.map(({ member, metrics }) => (
        <li key={member.id}>
          <Link
            to={`/members/${member.id}?period=${period}`}
            className="group block space-y-4 rounded-[28px] bg-card p-5 transition-shadow hover:shadow-soft focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <div className="flex items-center gap-3">
              <MemberAvatar member={member} />
              <span className="min-w-0 flex-1 truncate text-base font-semibold">{member.display_name}</span>
              <span className="grid size-10 place-items-center rounded-full bg-primary text-primary-foreground transition-transform group-hover:translate-x-0.5">
                <ArrowRight className="size-[18px]" aria-hidden />
                <span className="sr-only">Open {member.display_name}</span>
              </span>
            </div>
            <dl className="space-y-2.5">
              {SERIES.map((s) => {
                const value = metrics[s.key].value
                return (
                  <div key={s.key} className="grid grid-cols-[6.5rem_1fr_2rem] items-center gap-2.5 text-xs sm:grid-cols-[7.5rem_1fr_2rem]">
                    <dt className="text-muted-foreground">{s.label}</dt>
                    <dd className="h-3 overflow-hidden rounded-full bg-track" aria-hidden>
                      {value !== null && value > 0 && <div className="h-3 rounded-full" style={{ width: `${(value / max) * 100}%`, background: s.tile }} />}
                    </dd>
                    <dd className="text-right text-sm font-semibold tabular-nums">{value === null ? <span title={UNAVAILABLE}>—</span> : value}</dd>
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
