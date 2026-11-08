import { useCallback, useEffect, useState } from 'react'

import { ApiError, apiGet } from '@/lib/api'

type Common = { retry: () => void }
type State<T> = Common &
  (
    | { status: 'loading'; data: null; error: null }
    | { status: 'success'; data: T; error: null }
    | { status: 'error'; data: null; error: ApiError }
  )

type Settled<T> = { key: string; data: T; error: null } | { key: string; data: null; error: ApiError }

/** Minimal data-fetching hook. Re-fetches when `path` changes or `retry()` is called. */
export function useApi<T>(path: string): State<T> {
  const [settled, setSettled] = useState<Settled<T> | null>(null)
  const [attempt, setAttempt] = useState(0)
  const key = `${path}#${attempt}`
  const retry = useCallback(() => setAttempt((n) => n + 1), [])

  useEffect(() => {
    const controller = new AbortController()
    apiGet<T>(path, controller.signal)
      .then((data) => setSettled({ key, data, error: null }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        const apiError = error instanceof ApiError ? error : new ApiError(0, 'Unexpected error.')
        setSettled({ key, data: null, error: apiError })
      })
    return () => controller.abort()
  }, [path, key])

  // A result for a previous key means the current request is still in flight.
  if (!settled || settled.key !== key) return { status: 'loading', data: null, error: null, retry }
  if (settled.error) return { status: 'error', data: null, error: settled.error, retry }
  return { status: 'success', data: settled.data as T, error: null, retry }
}
