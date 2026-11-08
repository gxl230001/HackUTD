import { Ban, Flag, MessageSquareWarning, PhoneIncoming, PhoneOutgoing } from 'lucide-react'

import type { RecentEvent } from '@/lib/api'
import { dateTime, describeEvent, relativeTime } from '@/lib/format'

function iconFor(event: RecentEvent) {
  if (event.event_type === 'blocked_call') return Ban
  if (event.event_type === 'reported_number') return Flag
  if (event.event_type === 'suspicious_message') return MessageSquareWarning
  return event.interaction_type === 'returned' ? PhoneOutgoing : PhoneIncoming
}

export function RecentActivity({ events }: { events: RecentEvent[] }) {
  if (events.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">No scam activity recorded in this period.</p>
  }
  return (
    <ul className="divide-y">
      {events.map((event) => {
        const Icon = iconFor(event)
        return (
          <li key={event.id} className="flex items-start gap-3 py-2.5">
            <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground">
              <Icon className="size-4" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm">
                <span className="font-medium">{event.member_name}</span> · {describeEvent(event)}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {event.scam_category_label ?? 'Uncategorized'}
                {event.source === 'synthetic_demo' && ' · Simulated'}
              </p>
            </div>
            <time dateTime={event.timestamp} title={dateTime(event.timestamp)} className="shrink-0 text-xs text-muted-foreground">
              {relativeTime(event.timestamp)}
            </time>
          </li>
        )
      })}
    </ul>
  )
}
