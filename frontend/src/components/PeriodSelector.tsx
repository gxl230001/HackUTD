import type { Period } from '@/lib/api'
import { PERIODS } from '@/lib/format'
import { cn } from '@/lib/utils'

export function PeriodSelector({ value, onChange }: { value: Period; onChange: (p: Period) => void }) {
  return (
    <div role="radiogroup" aria-label="Reporting period" className="inline-flex w-fit gap-1 rounded-full bg-card p-1.5 shadow-soft">
      {PERIODS.map((p) => (
        <button
          key={p.key}
          type="button"
          role="radio"
          aria-checked={value === p.key}
          aria-label={p.long}
          onClick={() => onChange(p.key)}
          className={cn(
            'h-10 min-w-14 rounded-full px-5 text-[13px] font-semibold text-muted-foreground transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
            value === p.key && 'bg-primary text-primary-foreground',
          )}
        >
          {p.label}
        </button>
      ))}
    </div>
  )
}
