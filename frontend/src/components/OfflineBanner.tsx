import { WifiOff } from 'lucide-react'
import { useSyncExternalStore } from 'react'

function subscribe(callback: () => void) {
  window.addEventListener('online', callback)
  window.addEventListener('offline', callback)
  return () => {
    window.removeEventListener('online', callback)
    window.removeEventListener('offline', callback)
  }
}

export function OfflineBanner() {
  const online = useSyncExternalStore(subscribe, () => navigator.onLine, () => true)
  if (online) return null
  return (
    <div role="alert" className="flex items-center justify-center gap-2 bg-foreground px-4 py-1.5 text-xs text-background">
      <WifiOff className="size-3.5" aria-hidden />
      You’re offline. Activity can’t be refreshed until you reconnect.
    </div>
  )
}
