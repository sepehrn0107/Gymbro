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
      className="fixed bottom-0 left-0 right-0 z-50 flex justify-center px-4 pb-[calc(1rem+env(safe-area-inset-bottom))]"
    >
      <ul
        className="glass-panel flex w-full max-w-sm items-stretch rounded-3xl shadow-ambient"
        role="list"
      >
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/")

          return (
            <li key={href} className="flex flex-1">
              <Link
                href={href}
                className={[
                  "flex min-h-[60px] flex-1 flex-col items-center justify-center gap-1 px-1 font-label text-[10px] font-bold uppercase tracking-widest transition-colors",
                  isActive ? "text-primary" : "text-text-secondary",
                ].join(" ")}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.5 : 1.75}
                  aria-hidden="true"
                />
                <span>{label}</span>
                {isActive && (
                  <span className="h-1 w-4 rounded-full bg-primary" />
                )}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
