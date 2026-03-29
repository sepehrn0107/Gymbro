import Link from "next/link"
import { auth } from "@/lib/auth"
import { Zap, Flame, Clock, Dumbbell } from "lucide-react"

export default async function DashboardPage() {
  const session = await auth()
  const firstName = session?.user?.name?.split(" ")[0] ?? "there"
  const initial = firstName[0]?.toUpperCase() ?? "?"

  return (
    <div className="space-y-8 px-4 py-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <p className="font-label text-[10px] font-bold uppercase tracking-[0.25em] text-outline">
            Readiness Level: Optimal
          </p>
          <h1 className="mt-1 font-heading text-4xl font-black leading-none tracking-tight text-text-primary">
            Hey,{" "}
            <span className="text-primary metric-glow">{firstName}</span>
          </h1>
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-raised">
          <span className="font-heading text-sm font-bold text-primary">
            {initial}
          </span>
        </div>
      </header>

      {/* Primary CTA */}
      <Link
        href="/workout"
        className="flex min-h-[72px] w-full items-center justify-between rounded-xl bg-primary px-6 py-5 font-heading text-xl font-bold tracking-tight text-primary-foreground shadow-ambient transition-opacity active:opacity-80"
      >
        <span>Start a Workout</span>
        <Zap size={24} strokeWidth={2.5} aria-hidden="true" />
      </Link>

      {/* Stats bento */}
      <section>
        <p className="mb-3 font-label text-[10px] font-bold uppercase tracking-[0.25em] text-outline">
          This Month
        </p>
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-surface p-4 border-l-2 border-primary">
            <div className="mb-2 flex items-center justify-between">
              <p className="font-label text-[10px] uppercase tracking-widest text-outline">
                Sessions
              </p>
              <Clock size={12} className="text-outline" aria-hidden="true" />
            </div>
            <p className="font-heading text-2xl font-black leading-none text-text-primary metric-glow">
              —
            </p>
          </div>
          <div className="rounded-lg bg-surface p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="font-label text-[10px] uppercase tracking-widest text-outline">
                Volume
              </p>
              <Dumbbell size={12} className="text-outline" aria-hidden="true" />
            </div>
            <p className="font-heading text-2xl font-black leading-none text-text-primary">
              —
            </p>
          </div>
          <div className="rounded-lg bg-surface p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="font-label text-[10px] uppercase tracking-widest text-outline">
                Streak
              </p>
              <Flame size={12} className="text-outline" aria-hidden="true" />
            </div>
            <p className="font-heading text-2xl font-black leading-none text-text-primary">
              —
            </p>
          </div>
        </div>
      </section>

      {/* Recent Activity */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-label text-[10px] font-bold uppercase tracking-[0.25em] text-outline">
            Recent Activity
          </h2>
          <Link
            href="/history"
            className="font-label text-[10px] font-bold uppercase tracking-widest text-primary underline-offset-2 hover:underline"
          >
            View All
          </Link>
        </div>
        <div className="flex w-full items-center justify-center rounded-xl bg-surface py-14">
          <p className="font-body text-sm text-text-secondary">
            No workouts yet — start your first session.
          </p>
        </div>
      </section>

      {/* Quick Nav Shortcuts */}
      <section>
        <p className="mb-3 font-label text-[10px] font-bold uppercase tracking-[0.25em] text-outline">
          Quick Access
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/exercises"
            className="flex items-center gap-3 rounded-lg bg-surface p-4 transition-colors hover:bg-surface-raised"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-surface-raised">
              <Dumbbell size={18} className="text-primary" aria-hidden="true" />
            </div>
            <div>
              <p className="font-heading text-sm font-bold text-text-primary">
                Exercises
              </p>
              <p className="font-label text-[10px] uppercase tracking-widest text-outline">
                Library
              </p>
            </div>
          </Link>
          <Link
            href="/history"
            className="flex items-center gap-3 rounded-lg bg-surface p-4 transition-colors hover:bg-surface-raised"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-surface-raised">
              <Clock size={18} className="text-primary" aria-hidden="true" />
            </div>
            <div>
              <p className="font-heading text-sm font-bold text-text-primary">
                History
              </p>
              <p className="font-label text-[10px] uppercase tracking-widest text-outline">
                All Sessions
              </p>
            </div>
          </Link>
        </div>
      </section>
    </div>
  )
}
