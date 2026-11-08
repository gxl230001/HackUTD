import type { Metric, Period, Rate, RecentEvent } from '@/lib/api'

export const PERIODS: { key: Period; label: string; long: string }[] = [
  { key: '7d', label: '7D', long: 'Last 7 days' },
  { key: '30d', label: '30D', long: 'Last 30 days' },
  { key: '90d', label: '90D', long: 'Last 90 days' },
]

export const UNAVAILABLE = 'Data unavailable'

export function periodLabel(period: Period): string {
  return PERIODS.find((p) => p.key === period)?.long ?? period
}

export function browserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  } catch {
    return 'UTC'
  }
}

/** Query string shared by analytics requests. */
export function analyticsQuery(period: Period): string {
  return new URLSearchParams({ period, tz: browserTimeZone() }).toString()
}

export function metricText(metric: Metric): string {
  return metric.value === null ? UNAVAILABLE : metric.value.toLocaleString()
}

export function rateText(rate: Rate): string | null {
  if (rate.value === null) return null
  return `${Math.round(rate.value * 100)}%`
}

/** "Nov 3" from an ISO date (YYYY-MM-DD), without timezone shifting. */
export function shortDate(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function dateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

export function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const minutes = Math.round(diffMs / 60000)
  if (minutes < 60) return `${Math.max(minutes, 1)}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  return days < 7 ? `${days}d ago` : dateTime(iso)
}

export function describeEvent(event: Pick<RecentEvent, 'event_type' | 'interaction_type'>): string {
  switch (event.event_type) {
    case 'blocked_call':
      return 'Suspicious call blocked'
    case 'reported_number':
      return 'Reported a suspicious number'
    case 'suspicious_message':
      return event.interaction_type === 'replied' ? 'Replied to a suspicious message' : 'Suspicious message received'
    case 'scam_likely_call':
      if (event.interaction_type === 'returned') return 'Called back a suspicious number'
      if (event.interaction_type === 'answered') return 'Answered a Scam Likely call'
      if (event.interaction_type === 'not_answered') return 'Scam Likely call not answered'
      return 'Scam Likely call received'
  }
}
