import { AlertCircle, Loader2 } from 'lucide-react'
import type { ReactNode } from 'react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export function PageLoading({ label = 'Loading' }: { label?: string }) {
  return (
    <div role="status" className="flex min-h-40 items-center justify-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="size-4 animate-spin" aria-hidden />
      {label}…
    </div>
  )
}

export function PageError({ title, message, children }: { title: string; message: string; children?: ReactNode }) {
  return (
    <Alert variant="destructive">
      <AlertCircle aria-hidden />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        {message}
        {children}
      </AlertDescription>
    </Alert>
  )
}
