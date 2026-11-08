import { AlertCircle, Loader2, RotateCw } from 'lucide-react'
import type { ReactNode } from 'react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { type ApiError, friendlyError } from '@/lib/api'

export function PageLoading({ label = 'Loading' }: { label?: string }) {
  return (
    <div role="status" className="flex min-h-40 items-center justify-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="size-4 animate-spin" aria-hidden />
      {label}…
    </div>
  )
}

export function PageError({ title, message, onRetry, children }: { title: string; message: string; onRetry?: () => void; children?: ReactNode }) {
  return (
    <Alert variant="destructive">
      <AlertCircle aria-hidden />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        <p>{message}</p>
        {children}
        {onRetry && (
          <Button variant="outline" size="sm" className="mt-3" onClick={onRetry}>
            <RotateCw aria-hidden /> Try again
          </Button>
        )}
      </AlertDescription>
    </Alert>
  )
}

/** Standard error box for a failed API call; retryable unless retrying can’t help. */
export function ApiErrorState({ title, error, onRetry }: { title: string; error: ApiError; onRetry: () => void }) {
  const retryable = error.status === 0 || error.status >= 500
  return <PageError title={title} message={friendlyError(error)} onRetry={retryable ? onRetry : undefined} />
}

export function MetricsSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2" aria-hidden>
      {[0, 1, 2].map((group) => (
        <div key={group} className={group === 2 ? 'space-y-2 md:col-span-2' : 'space-y-2'}>
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div role="status" aria-label="Loading activity" className="space-y-6">
      <Skeleton className="h-4 w-80 max-w-full" />
      <MetricsSkeleton />
      <div className="grid gap-4 lg:grid-cols-5">
        <Skeleton className="h-80 lg:col-span-3" />
        <Skeleton className="h-80 lg:col-span-2" />
      </div>
    </div>
  )
}
