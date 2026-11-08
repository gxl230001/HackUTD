import { AlertTriangle } from 'lucide-react'
import { isRouteErrorResponse, useRouteError } from 'react-router'

import { Button } from '@/components/ui/button'

/** Shown if a screen crashes or a lazy-loaded chunk fails (e.g. after a deploy). */
export function RouteError() {
  const error = useRouteError()
  const chunkFailed = error instanceof Error && /dynamically imported module|Importing a module script/i.test(error.message)
  if (import.meta.env.DEV) console.error(error)

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 px-4 text-center">
      <AlertTriangle className="size-8 text-orange-deep" aria-hidden />
      <h1 className="text-xl font-semibold">{isRouteErrorResponse(error) && error.status === 404 ? 'Page not found' : 'Something went wrong'}</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        {chunkFailed ? 'A newer version of CloseGuard is available.' : 'This screen hit an unexpected problem. Reloading usually fixes it.'}
      </p>
      <div className="flex gap-2">
        <Button onClick={() => window.location.reload()}>Reload</Button>
        <Button variant="outline" onClick={() => window.location.assign('/dashboard')}>Go to dashboard</Button>
      </div>
    </div>
  )
}
