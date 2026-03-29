import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth-helpers"
import { BottomNav } from "@/components/layout/BottomNav"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <main className="flex-1 pb-[calc(80px+env(safe-area-inset-bottom))]">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
