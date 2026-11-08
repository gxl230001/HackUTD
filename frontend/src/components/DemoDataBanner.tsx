import { Info } from 'lucide-react'

/**
 * Persistent disclosure: CloseGuard is not connected to T-Mobile and every
 * family, member and activity record in the demo is fictional.
 */
export function DemoDataBanner({ className = '' }: { className?: string }) {
  return (
    <div role="note" className={`flex items-center gap-2.5 rounded-[20px] bg-banner px-4 py-3 text-xs font-medium text-banner-foreground ${className}`}>
      <Info className="size-[18px] shrink-0" aria-hidden />
      <span>
        <strong className="font-bold">Simulated demo data.</strong> Not connected to T-Mobile or any real account.
      </span>
    </div>
  )
}
