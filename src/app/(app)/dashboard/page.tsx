import Link from "next/link"
import { auth } from "@/lib/auth"

export default async function DashboardPage() {
  const session = await auth()
  const name = session?.user?.name ?? "there"

  return (
    <div className="px-4 py-6">
      <header className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-text-primary">
          Welcome back, {name}
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Ready to crush it today?
        </p>
      </header>

      <section>
        <Link
          href="/workout"
          className="flex min-h-[56px] w-full items-center justify-center rounded-xl bg-accent px-6 py-4 font-heading text-lg font-semibold text-accent-foreground shadow-lg transition-opacity active:opacity-80"
        >
          Start a Workout
        </Link>
      </section>
    </div>
  )
}
