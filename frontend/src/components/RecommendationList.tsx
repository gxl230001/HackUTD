import { ArrowRight, Sparkles } from 'lucide-react'
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
              className="group flex items-center gap-3.5 rounded-[28px] bg-card p-5 transition-shadow hover:shadow-soft focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <span className="grid size-12 shrink-0 place-items-center rounded-full bg-primary text-sage">
                <Sparkles className="size-[22px]" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-base font-semibold">{rec.title}</span>
                <span className="mt-1 block text-xs text-muted-foreground">{rec.reasons[0]}</span>
              </span>
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition-transform group-hover:translate-x-0.5">
                <ArrowRight className="size-[18px]" aria-hidden />
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted-foreground">{recs.data.disclaimer}</p>
    </div>
  )
}
