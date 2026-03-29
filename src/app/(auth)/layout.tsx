export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="font-heading text-4xl font-bold tracking-tight text-accent">
          GymBro
        </h1>
        <p className="mt-1 text-sm text-text-secondary">Track your workouts</p>
      </div>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  )
}
