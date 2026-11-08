import { ChevronRight, UserRound } from 'lucide-react'
import { Link } from 'react-router'

import type { Member } from '@/lib/api'

export function MemberList({ members }: { members: Member[] }) {
  if (members.length === 0) {
    return <p className="text-sm text-muted-foreground">No family members have been added yet.</p>
  }
  return (
    <ul className="divide-y">
      {members.map((member) => (
        <li key={member.id}>
          <Link
            to={`/members/${member.id}`}
            className="flex items-center gap-3 rounded-lg px-1 py-3 transition-colors hover:bg-muted/60"
          >
            <span className="grid size-9 place-items-center rounded-full bg-accent text-accent-foreground">
              <UserRound className="size-4" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{member.display_name}</span>
              <span className="block truncate text-xs text-muted-foreground">
                {[member.relationship, member.phone_label].filter(Boolean).join(' · ') || 'Family member'}
              </span>
            </span>
            <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
          </Link>
        </li>
      ))}
    </ul>
  )
}
