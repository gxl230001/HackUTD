import { env } from '@/lib/env'
import { supabase } from '@/lib/supabase'

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function authHeader(): Promise<Record<string, string>> {
  if (!supabase) return {}
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  return token ? { Authorization: `Bearer ${token}` } : {}
}

/** GET a JSON resource from the CloseGuard backend with the user's access token. */
export async function apiGet<T>(path: string, signal?: AbortSignal): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${env.apiBaseUrl}${path}`, {
      headers: { Accept: 'application/json', ...(await authHeader()) },
      signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new ApiError(0, 'Could not reach the CloseGuard server.')
  }

  if (!response.ok) {
    let message = `Request failed (${response.status}).`
    try {
      const body = (await response.json()) as { detail?: unknown }
      if (typeof body.detail === 'string') message = body.detail
    } catch {
      // Non-JSON error body; keep the generic message.
    }
    throw new ApiError(response.status, message)
  }
  return (await response.json()) as T
}

// --- Response types (mirror backend/app/schemas) ---------------------------

export type Health = {
  status: 'ok' | 'degraded'
  database: 'ok' | 'error' | 'not_configured'
}

export type Family = {
  id: string
  name: string
  member_count: number
}

export type Member = {
  id: string
  display_name: string
  relationship: string | null
  phone_label: string | null
}
