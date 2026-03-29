export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-4 py-8">
      <div className="mb-10 text-center">
        <h1 className="font-heading text-5xl font-black tracking-[-0.04em] text-primary">
          GYMBRO
        </h1>
        <p className="mt-1 font-label text-[10px] font-bold uppercase tracking-[0.3em] text-outline">
          Track your workouts
        </p>
      </div>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  )
}
