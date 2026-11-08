type Row = { label: string; value: number | null; color: string }

/** Dark pill tooltip: date on top, one row per series. */
export function ChartTooltipBox({ title, rows }: { title: string; rows: Row[] }) {
  return (
    <div className="min-w-44 rounded-2xl bg-primary px-3.5 py-2.5 text-xs text-primary-foreground shadow-float">
      <p className="mb-1.5 text-on-ink-soft">{title}</p>
      <ul className="space-y-1">
        {rows.map((row) => (
          <li key={row.label} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5">
              <span aria-hidden className="size-2 rounded-full" style={{ background: row.color }} />
              {row.label}
            </span>
            <span className="font-semibold tabular-nums">{row.value ?? '—'}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
