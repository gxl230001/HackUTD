import { NavLink, Outlet, ScrollRestoration } from 'react-router'

import { DemoDataBanner } from '@/components/DemoDataBanner'
import { Logo } from '@/components/Logo'
import { OfflineBanner } from '@/components/OfflineBanner'
import { NAV_ITEMS } from '@/components/layout/nav-items'
import { cn } from '@/lib/utils'

/**
 * Signed-in layout. Mobile-first: a floating pill tab bar on small screens; from
 * the md breakpoint up, a dark sidebar with the content on a rounded panel.
 */
export function AppShell() {
  return (
    <div className="min-h-dvh bg-background md:bg-sidebar md:p-4">
      {/* New pages start at the top; going back restores position. Keyed by path so
          switching the period (a query-string change) doesn't jump the page. */}
      <ScrollRestoration getKey={(location) => location.pathname} />
      <div className="sticky top-0 z-40 empty:hidden">
        <OfflineBanner />
      </div>

      <aside className="fixed inset-y-4 left-4 z-20 hidden w-56 flex-col px-2 py-6 md:flex">
        <div className="px-2">
          <Logo light />
        </div>
        <nav aria-label="Main" className="mt-8 flex flex-col gap-1.5">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'group flex h-13 items-center gap-3 rounded-full px-4 text-sm font-semibold text-sidebar-foreground transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sage focus-visible:outline-none',
                  isActive && 'bg-sidebar-accent text-sidebar-accent-foreground [&_svg]:text-sage',
                )
              }
            >
              <Icon className="size-[22px]" aria-hidden />
              {label}
            </NavLink>
          ))}
        </nav>
        <p className="mt-auto px-4 text-xs text-sidebar-foreground">Protection is stronger together.</p>
      </aside>

      <div className="min-h-dvh md:ml-60 md:min-h-[calc(100dvh-2rem)] md:rounded-[36px] md:bg-background">
        <header className="flex items-center px-4 pt-4 md:hidden">
          <Logo />
        </header>
        <main className="mx-auto w-full max-w-6xl px-4 pt-4 pb-32 md:px-8 md:pt-8 md:pb-12">
          <DemoDataBanner className="mb-6" />
          <Outlet />
        </main>
      </div>

      <nav
        aria-label="Main"
        className="fixed inset-x-4 bottom-4 z-30 mb-[env(safe-area-inset-bottom)] flex items-center justify-between rounded-full bg-card p-2 shadow-float md:hidden"
      >
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            aria-label={label}
            className={({ isActive }) =>
              cn(
                'flex h-13 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold text-muted-foreground transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                isActive && 'bg-primary px-5 text-primary-foreground [&_svg]:text-sage',
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon className="size-[22px]" aria-hidden />
                {isActive && label}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
