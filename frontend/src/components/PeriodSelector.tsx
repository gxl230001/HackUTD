import type { Period } from '@/lib/api'
import { PERIODS } from '@/lib/format'
import { cn } from '@/lib/utils'

export function PeriodSelector({ value, onChange }: { value: Period; onChange: (p: Period) => void }) {
  return (
    <div role="radiogroup" aria-label="Reporting period" className="inline-flex rounded-lg bg-muted p-1">
      {PERIODS.map((p) => (
        <button
          key={p.key}
          type="button"
          role="radio"
          aria-checked={value === p.key}
          aria-label={p.long}
          onClick={() => onChange(p.key)}
          className={cn(
            'min-w-14 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
            value === p.key && 'bg-card text-foreground shadow-sm',
          )}
        >
          {p.label}
        </button>
      ))}
    </div>
  )
}
