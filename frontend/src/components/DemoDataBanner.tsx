import { FlaskConical } from 'lucide-react'

/**
 * Persistent disclosure: CloseGuard is not connected to T-Mobile and every
 * family, member and activity record in the demo is fictional.
 */
export function DemoDataBanner() {
  return (
    <div
      role="note"
      className="flex items-center justify-center gap-2 bg-amber-50 px-4 py-1.5 text-center text-xs text-amber-900 ring-1 ring-amber-200"
    >
      <FlaskConical className="size-3.5 shrink-0" aria-hidden />
      <span>
        <strong className="font-semibold">Simulated demo data.</strong> Not connected to T-Mobile
        or any real account.
      </span>
    </div>
  )
}
