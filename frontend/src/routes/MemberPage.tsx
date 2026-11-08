import { ArrowLeft, CheckCircle2, CircleDashed, Eye, MinusCircle } from 'lucide-react'
import { Link, useParams } from 'react-router'

import { TrendChart } from '@/components/charts/TrendChart'
import { DataSources } from '@/components/DataSources'
import { MetricOverview } from '@/components/MetricOverview'
import { PageHeader } from '@/components/PageHeader'
import { ApiErrorState, DashboardSkeleton, PageError } from '@/components/PageState'
import { PeriodSelector } from '@/components/PeriodSelector'
import { RecommendationList } from '@/components/RecommendationList'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useApi } from '@/hooks/useApi'
import { usePeriod } from '@/hooks/usePeriod'
import type { MemberInsights } from '@/lib/api'
import { analyticsQuery, periodLabel } from '@/lib/format'

function BehaviorIcon({ observed }: { observed: boolean | null }) {
  if (observed === null) return <CircleDashed className="size-4 text-muted-foreground" aria-label="Not enough data" />
  return observed ? (
    <CheckCircle2 className="size-4 text-emerald-600" aria-label="Observed" />
  ) : (
    <MinusCircle className="size-4 text-muted-foreground" aria-label="Not observed" />
  )
}

export function MemberPage() {
  const { memberId = '' } = useParams()
  const [period, setPeriod] = usePeriod()
  const insights = useApi<MemberInsights>(`/api/members/${encodeURIComponent(memberId)}/insights?${analyticsQuery(period)}`)

  const back = (
    <Link to={`/dashboard?period=${period}`} className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
      <ArrowLeft className="size-4" aria-hidden /> Family dashboard
    </Link>
  )

  if (insights.status === 'loading') return <>{back}<DashboardSkeleton /></>
  if (insights.status === 'error') {
    const notFound = insights.error.status === 404 || insights.error.status === 422
    return (
      <>
        {back}
        {notFound ? (
          <PageError title="Member not found" message="This member isn’t part of your family plan." />
        ) : (
          <ApiErrorState title="Couldn’t load this member" error={insights.error} onRetry={insights.retry} />
        )}
      </>
    )
  }

  const { member, metrics, trends, patterns, protection_behaviors, data_sources } = insights.data
  const subtitle = [member.relationship, member.phone_label].filter(Boolean).join(' · ') || 'Family member'

  return (
    <>
      {back}
      <PageHeader title={member.display_name} description={`${subtitle} · ${periodLabel(period)}`} actions={<PeriodSelector value={period} onChange={setPeriod} />} />

      <div className="space-y-6">
        <DataSources sources={data_sources} />
        <MetricOverview metrics={metrics} />

        <Card>
          <CardHeader>
            <CardTitle>{member.display_name}’s activity over time</CardTitle>
            <CardDescription>{insights.data.period.bucket_days === 1 ? 'Daily' : 'Weekly'} totals, {periodLabel(period).toLowerCase()}.</CardDescription>
          </CardHeader>
          <CardContent>
            <TrendChart points={trends} bucketDays={insights.data.period.bucket_days} />
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Eye className="size-4" aria-hidden /> What we observed</CardTitle>
              <CardDescription>Recurring patterns in the activity data. These describe activity, not intent or outcome.</CardDescription>
            </CardHeader>
            <CardContent>
              {patterns.length === 0 ? (
                <p className="text-sm text-muted-foreground">Not enough activity to identify patterns.</p>
              ) : (
                <ul className="list-disc space-y-2 pl-5 text-sm marker:text-muted-foreground">
                  {patterns.map((p) => <li key={p.key}>{p.text}</li>)}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Protection behaviors</CardTitle>
              <CardDescription>Which protective habits show up in the data.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {protection_behaviors.map((b) => (
                  <li key={b.key} className="flex gap-3">
                    <span className="mt-0.5"><BehaviorIcon observed={b.observed} /></span>
                    <span>
                      <span className="block text-sm font-medium">{b.label}</span>
                      <span className="block text-xs text-muted-foreground">{b.detail}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Protection recommendations</CardTitle>
            <CardDescription>Based on {member.display_name}’s observed activity. Select one for details and next steps.</CardDescription>
          </CardHeader>
          <CardContent>
            <RecommendationList memberId={member.id} period={period} />
          </CardContent>
        </Card>
      </div>
    </>
  )
}
