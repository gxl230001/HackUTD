"use client";

import { Bell, House, ScanLine, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

interface NavItem {
  href: "/" | "/scan" | "/circle" | "/notifications";
  label: string;
  icon: LucideIcon;
}

const ITEMS: NavItem[] = [
  { href: "/", label: "Home", icon: House },
  { href: "/scan", label: "Scan", icon: ScanLine },
  { href: "/circle", label: "Circle", icon: Users },
  { href: "/notifications", label: "Alerts", icon: Bell },
];

interface BottomNavProps {
  unreadCount: number;
}

export function BottomNav({ unreadCount }: BottomNavProps) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main"
      className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 backdrop-blur"
    >
      <ul className="mx-auto grid max-w-[480px] grid-cols-4">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          const showBadge = href === "/notifications" && unreadCount > 0;
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-16 flex-col items-center justify-center gap-0.5 px-1 py-2 text-sm font-medium",
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span className="relative">
                  <Icon
                    aria-hidden
                    className="size-6"
                    strokeWidth={active ? 2.5 : 2}
                  />
                  {showBadge ? (
                    <span className="absolute -top-1.5 -right-2.5 flex min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs font-bold text-primary-foreground">
                      {unreadCount}
                    </span>
                  ) : null}
                </span>
                <span className={cn(active && "font-bold")}>
                  {label}
                  {showBadge ? (
                    <span className="sr-only">, {unreadCount} unread</span>
                  ) : null}
                </span>
                {active ? (
                  <span
                    aria-hidden
                    className="mt-0.5 h-1 w-8 rounded-full bg-primary"
                  />
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
