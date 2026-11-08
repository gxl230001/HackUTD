import { MemberComparison } from '@/components/charts/MemberComparison'
import { TrendChart } from '@/components/charts/TrendChart'
import { DataSources } from '@/components/DataSources'
import { MetricOverview } from '@/components/MetricOverview'
import { PageHeader } from '@/components/PageHeader'
import { PageError, PageLoading } from '@/components/PageState'
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

  return (
    <>
      <PageHeader
        title={family.status === 'success' ? family.data.name : 'Family Threat Dashboard'}
        description={`Family Threat Dashboard · ${periodLabel(period)}`}
        actions={<PeriodSelector value={period} onChange={setPeriod} />}
      />

      {summary.status === 'loading' && <PageLoading label="Loading family activity" />}
      {summary.status === 'error' && <PageError title="Couldn’t load family activity" message={summary.error.message} />}

      {summary.status === 'success' && (
        <div className="space-y-6">
          <DataSources sources={summary.data.data_sources} />
          <MetricOverview metrics={summary.data.totals} />

          <div className="grid gap-4 lg:grid-cols-5">
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Family scam activity over time</CardTitle>
                <CardDescription>
                  {summary.data.period.bucket_days === 1 ? 'Daily' : 'Weekly'} totals across all members, {periodLabel(period).toLowerCase()}.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {trends.status === 'loading' && <PageLoading label="Loading chart" />}
                {trends.status === 'error' && <PageError title="Couldn’t load the chart" message={trends.error.message} />}
                {trends.status === 'success' && <TrendChart points={trends.data.points} bucketDays={trends.data.period.bucket_days} />}
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Member comparison</CardTitle>
                <CardDescription>Exposure and interactions differ — compare them side by side.</CardDescription>
              </CardHeader>
              <CardContent>
                <MemberComparison rows={summary.data.members} period={period} />
              </CardContent>
            </Card>
          </div>

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
      )}
    </>
  )
}

