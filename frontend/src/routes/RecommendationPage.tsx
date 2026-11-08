import { ArrowLeft, ShieldCheck, Sparkles } from 'lucide-react'
import { Link, useParams } from 'react-router'

import { PageError } from '@/components/PageState'
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
    <Link to={`/members/${memberId}?period=${period}`} className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
      <ArrowLeft className="size-4" aria-hidden /> Back to member
    </Link>
  )

  if (explanation.status === 'loading') {
    return (
      <>
        {back}
        <div className="space-y-4" role="status" aria-label="Preparing explanation">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </>
    )
  }
  if (explanation.status === 'error') {
    const missing = explanation.error.status === 404 || explanation.error.status === 422
    return (
      <>
        {back}
        <PageError
          title={missing ? 'Recommendation not available' : 'Couldn’t load this recommendation'}
          message={missing ? 'This recommendation doesn’t apply to this member for the selected period.' : explanation.error.message}
        />
      </>
    )
  }

  const e = explanation.data
  return (
    <>
      {back}
      <div className="mb-6">
        <p className="text-sm text-muted-foreground">Recommendation for {e.member_name}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{e.title}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {e.source === 'ai' ? (
            <Badge variant="secondary"><Sparkles aria-hidden /> AI-assisted wording</Badge>
          ) : (
            <Badge variant="outline">Standard explanation</Badge>
          )}
          <span className="text-xs text-muted-foreground">Based on the {periodLabel(e.period.key).toLowerCase()} · simulated data</span>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-3">
          <Card>
            <CardHeader><CardTitle>What we’re seeing</CardTitle></CardHeader>
            <CardContent className="space-y-4 text-sm">
              <p>{e.summary}</p>
              <div>
                <h2 className="mb-1 font-medium">Why it matters</h2>
                <p className="text-muted-foreground">{e.why_it_matters}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Next steps</CardTitle>
              <CardDescription>Things you can do together, outside CloseGuard.</CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3">
                {e.next_steps.map((step, i) => (
                  <li key={step} className="flex gap-3 text-sm">
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">{i + 1}</span>
                    <span className="pt-0.5">{step}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Supporting activity</CardTitle>
              <CardDescription>The metrics behind this recommendation.</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="divide-y">
                {e.evidence.map((item) => (
                  <div key={item.key} className="flex items-center justify-between gap-4 py-2 text-sm">
                    <dt className="text-muted-foreground">{item.label}</dt>
                    <dd className="font-medium tabular-nums">{item.value}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ShieldCheck className="size-4 text-primary" aria-hidden /> Relevant Scam Shield features</CardTitle>
              <CardDescription>Managed through T-Mobile, not CloseGuard.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {e.features.map((f) => (
                  <li key={f.name} className="text-sm">
                    <span className="block font-medium">{f.name}</span>
                    <span className="block text-muted-foreground">{f.description}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        CloseGuard is not connected to T-Mobile and can’t change settings or subscriptions. Answering or returning a suspicious call does not mean
        someone was scammed.
      </p>
    </>
  )
}
