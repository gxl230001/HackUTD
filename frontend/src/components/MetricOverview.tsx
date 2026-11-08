import { Ban, Flag, MessageSquareWarning, PhoneCall, PhoneIncoming, PhoneOutgoing, Reply } from 'lucide-react'

import { MetricCard, MetricGroup } from '@/components/MetricCard'
import type { MemberMetrics } from '@/lib/api'
import { rateText } from '@/lib/format'

/** The three metric groups. Exposure and interactions are deliberately separate. */
export function MetricOverview({ metrics }: { metrics: MemberMetrics }) {
  const blockShare = rateText(metrics.block_share)
  const reached = metrics.calls_reached_device.value
  return (
    <div className="grid gap-7 md:grid-cols-2 md:gap-6">
      <MetricGroup title="Scam exposure" description="Suspicious activity that reached the account.">
        <MetricCard tone="exposure" label="Suspicious calls" icon={PhoneIncoming} metric={metrics.calls_received} detail={reached !== null ? `${reached} reached a phone` : null} />
        <MetricCard tone="exposure" label="Suspicious messages" icon={MessageSquareWarning} metric={metrics.messages_received} />
      </MetricGroup>
      <MetricGroup title="Protection activity" description="Blocking and reporting that was observed.">
        <MetricCard tone="protection" label="Blocked calls" icon={Ban} metric={metrics.calls_blocked} detail={blockShare ? `${blockShare} of suspicious calls` : null} />
        <MetricCard tone="protection" label="Numbers reported" icon={Flag} metric={metrics.numbers_reported} />
      </MetricGroup>
      {/* Three tiles: full width on desktop (one row of three); on mobile the first tile spans the row. */}
      <MetricGroup
        title="Suspicious interactions"
        description="Observed activity — not proof of harm."
        className="md:col-span-2"
        gridClassName="grid-cols-2 md:grid-cols-3"
      >
        <MetricCard
          tone="interactions"
          className="col-span-2 md:col-span-1"
          label="Labeled calls answered"
          icon={PhoneCall}
          metric={metrics.calls_answered}
          detail={reached !== null ? `of ${reached} that reached a phone` : null}
        />
        <MetricCard tone="interactions" label="Call-backs" icon={PhoneOutgoing} metric={metrics.calls_returned} />
        <MetricCard tone="interactions" label="Message replies" icon={Reply} metric={metrics.messages_replied} />
      </MetricGroup>
    </div>
  )
}
