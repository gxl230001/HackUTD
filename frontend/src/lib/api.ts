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

export type Period = '7d' | '30d' | '90d'

export type Metric = { value: number | null; status: 'available' | 'unavailable' }
export type Rate = { value: number | null; numerator: number | null; denominator: number | null }

export type MemberMetrics = {
  calls_received: Metric
  messages_received: Metric
  calls_blocked: Metric
  calls_reached_device: Metric
  numbers_reported: Metric
  calls_answered: Metric
  calls_returned: Metric
  messages_replied: Metric
  interactions: Metric
  block_share: Rate
  answered_share_of_reached: Rate
}

export type PeriodInfo = {
  key: Period
  days: number
  start: string
  end: string
  timezone: string
  bucket_days: number
}

export type DataSource = { source: string; label: string; status: 'active' | 'not_connected' }

export type TrendPoint = {
  start_date: string
  end_date: string
  calls_received: number | null
  calls_blocked: number | null
  interactions: number | null
  numbers_reported: number | null
}

export type RecentEvent = {
  id: string
  member_id: string
  member_name: string
  event_type: 'scam_likely_call' | 'blocked_call' | 'suspicious_message' | 'reported_number'
  interaction_type: string | null
  scam_category: string | null
  scam_category_label: string | null
  timestamp: string
  source: string
}

export type DashboardSummary = {
  period: PeriodInfo
  data_sources: DataSource[]
  totals: MemberMetrics
  members: { member: Member; metrics: MemberMetrics }[]
  recent_activity: RecentEvent[]
}

export type Trends = { period: PeriodInfo; points: TrendPoint[] }

export type MemberInsights = {
  member: Member
  period: PeriodInfo
  data_sources: DataSource[]
  metrics: MemberMetrics
  trends: TrendPoint[]
  patterns: { key: string; text: string }[]
  protection_behaviors: { key: string; label: string; observed: boolean | null; detail: string }[]
}

export type Evidence = { key: string; label: string; value: string }
export type Feature = { name: string; description: string }

export type Recommendation = {
  category: string
  title: string
  reasons: string[]
  evidence: Evidence[]
  summary: string
  why_it_matters: string
  next_steps: string[]
  features: Feature[]
  mentions_premium: boolean
}

export type MemberRecommendations = {
  member_id: string
  member_name: string
  period: PeriodInfo
  recommendations: Recommendation[]
  disclaimer: string
}

export type Explanation = {
  member_id: string
  member_name: string
  period: PeriodInfo
  category: string
  title: string
  source: 'ai' | 'fallback'
  model: string | null
  summary: string
  why_it_matters: string
  next_steps: string[]
  evidence: Evidence[]
  features: Feature[]
}
