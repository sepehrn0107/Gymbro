"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Dumbbell, Zap, Clock } from "lucide-react"

const NAV_ITEMS = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/exercises",
    label: "Exercises",
    icon: Dumbbell,
  },
  {
    href: "/workout",
    label: "Workout",
    icon: Zap,
  },
  {
    href: "/history",
    label: "History",
    icon: Clock,
  },
] as const

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Main navigation"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="flex items-stretch" role="list">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/")

          return (
            <li key={href} className="flex flex-1">
              <Link
                href={href}
                className={[
                  "flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 px-1 text-xs font-medium transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-text-secondary",
                ].join(" ")}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.5 : 1.75}
                  aria-hidden="true"
                />
                <span>{label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
