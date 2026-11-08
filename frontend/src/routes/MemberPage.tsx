import { ArrowLeft, Check, CircleDashed, Minus } from 'lucide-react'
import { Link, useParams } from 'react-router'

import { TrendChart } from '@/components/charts/TrendChart'
import { MemberAvatar } from '@/components/MemberAvatar'
import { MetricOverview } from '@/components/MetricOverview'
import { PageHeader } from '@/components/PageHeader'
import { ApiErrorState, DashboardSkeleton, PageError } from '@/components/PageState'
import { PeriodSelector } from '@/components/PeriodSelector'
import { RecommendationList } from '@/components/RecommendationList'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useApi } from '@/hooks/useApi'
import { usePeriod } from '@/hooks/usePeriod'
import type { MemberInsights } from '@/lib/api'
import { analyticsQuery, periodLabel } from '@/lib/format'

function BehaviorIcon({ observed }: { observed: boolean | null }) {
  const base = 'grid size-9 shrink-0 place-items-center rounded-full'
  if (observed === null) {
    return (
      <span className={`${base} bg-track text-muted-foreground`} role="img" aria-label="Not enough data">
        <CircleDashed className="size-[18px]" aria-hidden />
      </span>
    )
  }
  return observed ? (
    <span className={`${base} bg-sage text-foreground`} role="img" aria-label="Observed">
      <Check className="size-[18px]" strokeWidth={2.25} aria-hidden />
    </span>
  ) : (
    <span className={`${base} bg-track text-muted-foreground`} role="img" aria-label="Not observed">
      <Minus className="size-[18px]" strokeWidth={2.25} aria-hidden />
    </span>
  )
}

export function MemberPage() {
  const { memberId = '' } = useParams()
  const [period, setPeriod] = usePeriod()
  const insights = useApi<MemberInsights>(`/api/members/${encodeURIComponent(memberId)}/insights?${analyticsQuery(period)}`)

  const back = (
    <Link
      to={`/dashboard?period=${period}`}
      className="mb-5 inline-flex h-11 items-center gap-2 rounded-full bg-card pr-5 pl-3.5 text-sm font-semibold transition-shadow hover:shadow-soft focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <ArrowLeft className="size-[18px]" aria-hidden /> Family dashboard
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

  const { member, metrics, trends, patterns, protection_behaviors } = insights.data
  const subtitle = [member.relationship, member.phone_label].filter(Boolean).join(' · ') || 'Family member'

  return (
    <>
      {back}
      <PageHeader
        title={member.display_name}
        description={`${subtitle} · ${periodLabel(period)}`}
        leading={<MemberAvatar member={member} size="lg" />}
        actions={<PeriodSelector value={period} onChange={setPeriod} />}
      />

      <div className="space-y-7">
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

        <div className="grid items-start gap-7 lg:grid-cols-2 lg:gap-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>What we observed</CardTitle>
                <CardDescription>Recurring patterns in the activity data. These describe activity, not intent or outcome.</CardDescription>
                <CardAction>
                  {/* Decorative mascot. Reduced-motion users get a still frame instead of the looping GIF. */}
                  <picture aria-hidden>
                    <source media="(prefers-reduced-motion: reduce)" srcSet="/brand/owl-sleeping-still.png" />
                    <img src="/brand/owl-sleeping.gif" alt="" width={101} height={112} className="h-24 w-auto md:h-28" draggable={false} />
                  </picture>
                </CardAction>
              </CardHeader>
              <CardContent>
                {patterns.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Not enough activity to identify patterns.</p>
                ) : (
                  <ul className="space-y-3 text-sm">
                    {patterns.map((p) => (
                      <li key={p.key} className="flex gap-3">
                        <span aria-hidden className="mt-[7px] size-2 shrink-0 rounded-full bg-sage" />
                        <span>{p.text}</span>
                      </li>
                    ))}
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
                    <li key={b.key} className="flex items-center gap-3 rounded-[20px] bg-surface-soft p-3.5">
                      <BehaviorIcon observed={b.observed} />
                      <span>
                        <span className="block text-sm font-semibold">{b.label}</span>
                        <span className="block text-xs text-muted-foreground">{b.detail}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          <section aria-labelledby="recommendations" className="space-y-3">
            <div>
              <h2 id="recommendations" className="text-xl font-semibold">Protection recommendations</h2>
              <p className="text-xs text-muted-foreground">Based on {member.display_name}’s observed activity. Select one for details and next steps.</p>
            </div>
            <RecommendationList memberId={member.id} period={period} />
          </section>
        </div>
      </div>
    </>
  )
}
