import { cn } from '@/lib/utils'

export function Logo({ className, markClassName, light = false }: { className?: string; markClassName?: string; light?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-3 text-xl font-bold tracking-tight', light && 'text-on-ink', className)}>
      <span aria-hidden className={cn('grid size-11 place-items-center rounded-2xl bg-sage-soft', markClassName)}>
        <img src="/brand/owl.png" alt="" width={34} height={34} className="size-[34px] object-contain" draggable={false} />
      </span>
      Owlert
    </span>
  )
}
