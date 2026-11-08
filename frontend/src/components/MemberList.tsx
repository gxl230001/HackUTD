import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router'

import { MemberAvatar } from '@/components/MemberAvatar'
import type { Member } from '@/lib/api'

export function MemberList({ members }: { members: Member[] }) {
  if (members.length === 0) {
    return <p className="rounded-[28px] bg-card p-5 text-sm text-muted-foreground">No family members have been added yet.</p>
  }
  return (
    <ul className="space-y-3">
      {members.map((member) => (
        <li key={member.id}>
          <Link
            to={`/members/${member.id}`}
            className="group flex items-center gap-4 rounded-[28px] bg-card p-4 transition-shadow hover:shadow-soft focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <MemberAvatar member={member} size="lg" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-base font-semibold">{member.display_name}</span>
              <span className="block truncate text-xs text-muted-foreground">
                {[member.relationship, member.phone_label].filter(Boolean).join(' · ') || 'Family member'}
              </span>
            </span>
            <span className="grid size-10 place-items-center rounded-full bg-primary text-primary-foreground transition-transform group-hover:translate-x-0.5">
              <ArrowRight className="size-[18px]" aria-hidden />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
