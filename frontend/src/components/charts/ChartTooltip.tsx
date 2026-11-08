type Row = { label: string; value: number | null; color: string }

export function ChartTooltipBox({ title, rows }: { title: string; rows: Row[] }) {
  return (
    <div className="min-w-44 rounded-lg bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md ring-1 ring-foreground/10">
      <p className="mb-1.5 font-medium">{title}</p>
      <ul className="space-y-1">
        {rows.map((row) => (
          <li key={row.label} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span aria-hidden className="size-2 rounded-full" style={{ background: row.color }} />
              {row.label}
            </span>
            <span className="font-medium tabular-nums">{row.value ?? '—'}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
