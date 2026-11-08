import type { Member } from '@/lib/api'
import { cn } from '@/lib/utils'

type Pet = 'bear' | 'dog' | 'mouse'

const PETS: Record<Pet, { src: string; tone: string }> = {
  bear: { src: '/avatars/bear.png', tone: 'bg-orange-soft' },
  dog: { src: '/avatars/dog.png', tone: 'bg-lavender-soft' },
  mouse: { src: '/avatars/mouse.png', tone: 'bg-sage-soft' },
}

/** Picks a pet icon from the relationship label; unknown relationships fall back to initials. */
function petFor(relationship: string | null): Pet | null {
  const r = (relationship ?? '').toLowerCase()
  if (/grand/.test(r)) return 'bear'
  if (/parent|mom|mother|dad|father/.test(r)) return 'dog'
  if (/child|daughter|son|kid/.test(r)) return 'mouse'
  return null
}

const SIZES = { md: 'size-11', lg: 'size-14' } as const

/** Member identity without photos: a pet icon on a soft tint (initials when no pet fits). */
export function MemberAvatar({ member, size = 'md', className }: { member: Pick<Member, 'display_name' | 'relationship'>; size?: keyof typeof SIZES; className?: string }) {
  const pet = petFor(member.relationship)
  return (
    <span
      aria-hidden
      className={cn('grid shrink-0 place-items-center overflow-hidden rounded-full', SIZES[size], pet ? PETS[pet].tone : 'bg-sage-soft', className)}
    >
      {pet ? (
        <img src={PETS[pet].src} alt="" className="size-[82%] translate-y-[7%] object-contain" draggable={false} />
      ) : (
        <span className="text-base font-semibold text-sage-deep">{member.display_name.trim().charAt(0).toUpperCase()}</span>
      )}
    </span>
  )
}
