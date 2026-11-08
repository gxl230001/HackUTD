import { NavLink, Outlet, ScrollRestoration } from 'react-router'

import { DemoDataBanner } from '@/components/DemoDataBanner'
import { Logo } from '@/components/Logo'
import { OfflineBanner } from '@/components/OfflineBanner'
import { NAV_ITEMS } from '@/components/layout/nav-items'
import { cn } from '@/lib/utils'

/**
 * Signed-in layout. Mobile-first: a bottom tab bar on small screens and a
 * fixed sidebar from the md breakpoint up.
 */
export function AppShell() {
  return (
    <div className="min-h-dvh bg-background">
      {/* New pages start at the top; going back restores position. Keyed by path so
          switching the period (a query-string change) doesn't jump the page. */}
      <ScrollRestoration getKey={(location) => location.pathname} />
      <div className="sticky top-0 z-30">
        <OfflineBanner />
        <DemoDataBanner />
        <header className="flex h-14 items-center border-b bg-card/95 px-4 backdrop-blur md:hidden">
          <Logo />
        </header>
      </div>

      <aside className="fixed inset-y-0 left-0 z-20 hidden w-60 flex-col border-r bg-sidebar pt-10 md:flex">
        <div className="px-5 py-4">
          <Logo />
        </div>
        <nav aria-label="Main" className="flex flex-col gap-1 px-3">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                  isActive && 'bg-sidebar-accent text-sidebar-accent-foreground',
                )
              }
            >
              <Icon className="size-4" aria-hidden />
              {label}
            </NavLink>
          ))}
        </nav>
        <p className="mt-auto px-5 py-4 text-xs text-muted-foreground">Protection is stronger together.</p>
      </aside>

      <main className="mx-auto w-full max-w-5xl px-4 pt-6 pb-24 md:pl-64 md:pr-8 md:pb-10 lg:max-w-6xl lg:pl-68">
        <Outlet />
      </main>

      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-3 border-t bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-1 py-2.5 text-xs font-medium text-muted-foreground',
                isActive && 'text-primary',
              )
            }
          >
            <Icon className="size-5" aria-hidden />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
