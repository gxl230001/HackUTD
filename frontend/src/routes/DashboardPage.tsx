import { MemberComparison } from '@/components/charts/MemberComparison'
import { TrendChart } from '@/components/charts/TrendChart'
import { MetricOverview } from '@/components/MetricOverview'
import { PageHeader } from '@/components/PageHeader'
import { ApiErrorState, DashboardSkeleton, PageLoading } from '@/components/PageState'
import { PeriodSelector } from '@/components/PeriodSelector'
import { RecentActivity } from '@/components/RecentActivity'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useApi } from '@/hooks/useApi'
import { usePeriod } from '@/hooks/usePeriod'
import type { DashboardSummary, Family, Trends } from '@/lib/api'
import { analyticsQuery, periodLabel } from '@/lib/format'

export function DashboardPage() {
  const [period, setPeriod] = usePeriod()
  const query = analyticsQuery(period)
  const family = useApi<Family>('/api/family')
  const summary = useApi<DashboardSummary>(`/api/dashboard/summary?${query}`)
  const trends = useApi<Trends>(`/api/dashboard/trends?${query}`)
  // A failure usually hits every request at once, so one retry reloads them all.
  const retryAll = () => {
    family.retry()
    summary.retry()
    trends.retry()
  }

  return (
    <>
      <PageHeader
        title={family.status === 'success' ? family.data.name : 'Family Threat Dashboard'}
        description={`Family Threat Dashboard · ${periodLabel(period)}`}
        actions={<PeriodSelector value={period} onChange={setPeriod} />}
      />

      {summary.status === 'loading' && <DashboardSkeleton />}
      {summary.status === 'error' && <ApiErrorState title="Couldn’t load family activity" error={summary.error} onRetry={retryAll} />}

      {summary.status === 'success' && (
        <div className="space-y-7">
          <MetricOverview metrics={summary.data.totals} />

          <Card>
            <CardHeader>
              <CardTitle>Family scam activity over time</CardTitle>
              <CardDescription>
                {summary.data.period.bucket_days === 1 ? 'Daily' : 'Weekly'} totals across all members, {periodLabel(period).toLowerCase()}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {trends.status === 'loading' && <PageLoading label="Loading chart" />}
              {trends.status === 'error' && <ApiErrorState title="Couldn’t load the chart" error={trends.error} onRetry={retryAll} />}
              {trends.status === 'success' && <TrendChart points={trends.data.points} bucketDays={trends.data.period.bucket_days} />}
            </CardContent>
          </Card>

          <div className="grid items-start gap-7 lg:grid-cols-2 lg:gap-6">
            <section aria-labelledby="member-comparison" className="space-y-3">
              <div>
                <h2 id="member-comparison" className="text-xl font-semibold">Member comparison</h2>
                <p className="text-xs text-muted-foreground">Receiving suspicious calls and interacting with them are different things. Bars share one scale.</p>
              </div>
              <MemberComparison rows={summary.data.members} period={period} />
            </section>

            <Card>
              <CardHeader>
                <CardTitle>Recent scam activity</CardTitle>
                <CardDescription>The 10 most recent events in this period.</CardDescription>
              </CardHeader>
              <CardContent>
                <RecentActivity events={summary.data.recent_activity} />
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </>
  )
}
