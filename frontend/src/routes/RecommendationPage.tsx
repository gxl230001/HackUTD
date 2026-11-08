import { ArrowLeft, Sparkles } from 'lucide-react'
import { Link, useParams } from 'react-router'

import { ApiErrorState, PageError } from '@/components/PageState'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useApi } from '@/hooks/useApi'
import { usePeriod } from '@/hooks/usePeriod'
import type { Explanation } from '@/lib/api'
import { analyticsQuery, periodLabel } from '@/lib/format'

export function RecommendationPage() {
  const { memberId = '', category = '' } = useParams()
  const [period] = usePeriod()
  const explanation = useApi<Explanation>(
    `/api/members/${encodeURIComponent(memberId)}/recommendations/${encodeURIComponent(category)}/explanation?${analyticsQuery(period)}`,
  )

  const back = (
    <Link
      to={`/members/${memberId}?period=${period}`}
      className="mb-5 inline-flex h-11 items-center gap-2 rounded-full bg-card pr-5 pl-3.5 text-sm font-semibold transition-shadow hover:shadow-soft focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <ArrowLeft className="size-[18px]" aria-hidden /> Back to member
    </Link>
  )

  if (explanation.status === 'loading') {
    return (
      <>
        {back}
        <div className="space-y-4" role="status" aria-label="Preparing explanation">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-28 w-full rounded-[28px]" />
          <Skeleton className="h-40 w-full rounded-[28px]" />
        </div>
      </>
    )
  }
  if (explanation.status === 'error') {
    const missing = explanation.error.status === 404 || explanation.error.status === 422
    return (
      <>
        {back}
        {missing ? (
          <PageError title="Recommendation not available" message="This recommendation doesn’t apply to this member for the selected period." />
        ) : (
          <ApiErrorState title="Couldn’t load this recommendation" error={explanation.error} onRetry={explanation.retry} />
        )}
      </>
    )
  }

  const e = explanation.data
  return (
    <>
      {back}
      <div className="mb-6">
        <p className="text-xs font-bold tracking-wider text-sage-deep uppercase">Recommendation for {e.member_name}</p>
        <h1 className="mt-1.5 text-3xl font-bold tracking-tight">{e.title}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          {e.source === 'ai' ? (
            <Badge variant="secondary"><Sparkles aria-hidden /> AI-assisted wording</Badge>
          ) : (
            <Badge variant="outline">Standard explanation</Badge>
          )}
          <span className="text-xs text-muted-foreground">Based on the {periodLabel(e.period.key).toLowerCase()}</span>
        </div>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[1fr_21rem]">
        <div className="space-y-5">
          <Card className="gap-2.5 px-1">
            <CardHeader><CardTitle>What we’re seeing</CardTitle></CardHeader>
            <CardContent className="text-base text-muted-foreground">
              <p>{e.summary}</p>
            </CardContent>
          </Card>

          <Card className="gap-2.5 px-1">
            <CardHeader><CardTitle>Why it matters</CardTitle></CardHeader>
            <CardContent className="text-base text-muted-foreground">
              <p>{e.why_it_matters}</p>
            </CardContent>
          </Card>

          <Card className="px-1">
            <CardHeader>
              <CardTitle>Next steps</CardTitle>
              <CardDescription>Things you can do together, outside CloseGuard.</CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="space-y-4">
                {e.next_steps.map((step, i) => (
                  <li key={step} className="flex gap-3.5 text-sm">
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-sage text-xs font-bold text-foreground">{i + 1}</span>
                    <span className="pt-1">{step}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Supporting activity</CardTitle>
              <CardDescription>The metrics behind this recommendation.</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="divide-y">
                {e.evidence.map((item) => (
                  <div key={item.key} className="flex items-center justify-between gap-4 py-3 text-sm">
                    <dt className="text-muted-foreground">{item.label}</dt>
                    <dd className="font-semibold tabular-nums">{item.value}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Relevant Scam Shield features</CardTitle>
              <CardDescription>Managed through T-Mobile, not CloseGuard.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {e.features.map((f) => (
                  <li key={f.name} className="rounded-[20px] bg-surface-soft p-4 text-sm">
                    <span className="block font-semibold">{f.name}</span>
                    <span className="mt-1 block text-xs text-muted-foreground">{f.description}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        CloseGuard can’t change Scam Shield settings or subscriptions. Answering or returning a suspicious call does not mean
        someone was scammed.
      </p>
    </>
  )
}
