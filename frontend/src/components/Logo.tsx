import { ShieldCheck } from 'lucide-react'

import { cn } from '@/lib/utils'

export function Logo({ className, markClassName, light = false }: { className?: string; markClassName?: string; light?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-3 text-xl font-bold tracking-tight', light && 'text-on-ink', className)}>
      <span className={cn('grid size-11 place-items-center rounded-2xl bg-primary text-sage', light && 'bg-sage text-foreground', markClassName)}>
        <ShieldCheck className="size-6" aria-hidden />
      </span>
      CloseGuard
    </span>
  )
}
