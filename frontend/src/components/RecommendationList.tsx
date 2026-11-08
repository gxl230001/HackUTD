import { ArrowRight, Lightbulb } from 'lucide-react'
import { Link } from 'react-router'

import { ApiErrorState, PageLoading } from '@/components/PageState'
import { useApi } from '@/hooks/useApi'
import type { MemberRecommendations, Period } from '@/lib/api'
import { analyticsQuery, periodLabel } from '@/lib/format'

export function RecommendationList({ memberId, period }: { memberId: string; period: Period }) {
  const recs = useApi<MemberRecommendations>(`/api/members/${memberId}/recommendations?${analyticsQuery(period)}`)

  if (recs.status === 'loading') return <PageLoading label="Loading recommendations" />
  if (recs.status === 'error') return <ApiErrorState title="Couldn’t load recommendations" error={recs.error} onRetry={recs.retry} />

  const evaluated = recs.data.period.key
  return (
    <div className="space-y-3">
      {evaluated !== period && (
        <p className="text-xs text-muted-foreground">
          Recommendations use at least 30 days of activity, so these are based on the {periodLabel(evaluated).toLowerCase()}.
        </p>
      )}
      <ul className="space-y-3">
        {recs.data.recommendations.map((rec) => (
          <li key={rec.category}>
            <Link
              to={`/members/${memberId}/recommendations/${rec.category}?period=${period}`}
              className="group flex gap-3 rounded-xl p-4 ring-1 ring-foreground/10 transition-colors hover:bg-accent/50"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground">
                <Lightbulb className="size-4" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">{rec.title}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">{rec.reasons[0]}</span>
              </span>
              <ArrowRight className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted-foreground">{recs.data.disclaimer}</p>
    </div>
  )
}
