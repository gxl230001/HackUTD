import { Ban, Flag, MessageSquareWarning, PhoneCall, PhoneIncoming, PhoneOutgoing, Reply } from 'lucide-react'

import { MetricCard, MetricGroup } from '@/components/MetricCard'
import type { MemberMetrics } from '@/lib/api'
import { rateText } from '@/lib/format'

/** The three metric groups. Exposure and interactions are deliberately separate. */
export function MetricOverview({ metrics }: { metrics: MemberMetrics }) {
  const blockShare = rateText(metrics.block_share)
  const reached = metrics.calls_reached_device.value
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <MetricGroup title="Scam exposure" description="Suspicious activity that reached the account.">
        <MetricCard label="Suspicious calls" icon={PhoneIncoming} metric={metrics.calls_received} detail={reached !== null ? `${reached} reached a phone` : null} />
        <MetricCard label="Suspicious messages" icon={MessageSquareWarning} metric={metrics.messages_received} />
      </MetricGroup>
      <MetricGroup title="Protection activity" description="Blocking and reporting that was observed.">
        <MetricCard label="Blocked calls" icon={Ban} metric={metrics.calls_blocked} detail={blockShare ? `${blockShare} of suspicious calls` : null} />
        <MetricCard label="Numbers reported" icon={Flag} metric={metrics.numbers_reported} />
      </MetricGroup>
      <MetricGroup
        title="Suspicious interactions"
        description="Observed activity — not proof of harm."
        className="md:col-span-2"
        gridClassName="grid-cols-2 sm:grid-cols-3"
      >
        <MetricCard
          label="Labeled calls answered"
          icon={PhoneCall}
          metric={metrics.calls_answered}
          detail={reached !== null ? `of ${reached} that reached a phone` : null}
        />
        <MetricCard label="Call-backs" icon={PhoneOutgoing} metric={metrics.calls_returned} />
        <MetricCard label="Message replies" icon={Reply} metric={metrics.messages_replied} />
      </MetricGroup>
    </div>
  )
}
