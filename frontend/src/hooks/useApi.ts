import { useEffect, useState } from 'react'

import { ApiError, apiGet } from '@/lib/api'

type State<T> =
  | { status: 'loading'; data: null; error: null }
  | { status: 'success'; data: T; error: null }
  | { status: 'error'; data: null; error: ApiError }

type Settled<T> = { path: string; data: T; error: null } | { path: string; data: null; error: ApiError }

const LOADING = { status: 'loading', data: null, error: null } as const

/** Minimal data-fetching hook. Re-fetches when `path` changes. */
export function useApi<T>(path: string): State<T> {
  const [settled, setSettled] = useState<Settled<T> | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    apiGet<T>(path, controller.signal)
      .then((data) => setSettled({ path, data, error: null }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        const apiError = error instanceof ApiError ? error : new ApiError(0, 'Unexpected error.')
        setSettled({ path, data: null, error: apiError })
      })
    return () => controller.abort()
  }, [path])

  // A result for a previous path means the current request is still in flight.
  if (!settled || settled.path !== path) return LOADING
  if (settled.error) return { status: 'error', data: null, error: settled.error }
  return { status: 'success', data: settled.data as T, error: null }
}
