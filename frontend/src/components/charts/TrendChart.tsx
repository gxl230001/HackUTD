import { useState } from 'react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { ChartLegend } from '@/components/charts/ChartLegend'
import { SERIES } from '@/components/charts/series'
import { ChartTooltipBox } from '@/components/charts/ChartTooltip'
import { Button } from '@/components/ui/button'
import type { TrendPoint } from '@/lib/api'
import { shortDate } from '@/lib/format'

function bucketLabel(point: TrendPoint, bucketDays: number): string {
  if (bucketDays === 1) return shortDate(point.start_date)
  const last = new Date(`${point.end_date}T00:00:00`)
  last.setDate(last.getDate() - 1)
  const lastIso = `${last.getFullYear()}-${String(last.getMonth() + 1).padStart(2, '0')}-${String(last.getDate()).padStart(2, '0')}`
  return `${shortDate(point.start_date)} – ${shortDate(lastIso)}`
}

export function TrendChart({ points, bucketDays }: { points: TrendPoint[]; bucketDays: number }) {
  const [showTable, setShowTable] = useState(false)
  const data = points.map((p) => ({ ...p, label: bucketLabel(p, bucketDays), tick: shortDate(p.start_date) }))
  const hasActivity = points.some((p) => (p.calls_received ?? 0) + (p.interactions ?? 0) > 0)

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <ChartLegend />
        <Button variant="ghost" size="sm" onClick={() => setShowTable((v) => !v)} aria-pressed={showTable}>
          {showTable ? 'Show chart' : 'Show table'}
        </Button>
      </div>

      {!hasActivity ? (
        <div className="flex h-56 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
          No scam activity recorded in this period.
        </div>
      ) : showTable ? (
        <div className="max-h-72 overflow-auto rounded-lg ring-1 ring-foreground/10">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-muted text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">{bucketDays === 1 ? 'Day' : 'Week'}</th>
                {SERIES.map((s) => (
                  <th key={s.key} className="px-3 py-2 text-right font-medium">{s.label}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.map((row) => (
                <tr key={row.start_date}>
                  <td className="px-3 py-1.5 whitespace-nowrap">{row.label}</td>
                  {SERIES.map((s) => (
                    <td key={s.key} className="px-3 py-1.5 text-right tabular-nums">{row[s.key] ?? '—'}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="h-56 sm:h-64" role="img" aria-label="Line chart of suspicious calls, blocked calls and suspicious interactions over time. Use “Show table” for the values.">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis
                dataKey="tick"
                tickLine={false}
                axisLine={{ stroke: 'var(--border)' }}
                tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                minTickGap={24}
              />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} width={44} />
              <Tooltip
                cursor={{ stroke: 'var(--muted-foreground)', strokeDasharray: '3 3' }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const row = payload[0].payload as (typeof data)[number]
                  return <ChartTooltipBox title={row.label} rows={SERIES.map((s) => ({ label: s.label, value: row[s.key], color: s.color }))} />
                }}
              />
              {SERIES.map((s) => (
                <Line
                  key={s.key}
                  type="linear"
                  dataKey={s.key}
                  name={s.label}
                  stroke={s.color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--card)' }}
                  isAnimationActive={false}
                  connectNulls={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
