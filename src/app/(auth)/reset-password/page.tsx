"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

type ResetState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const emailParam = searchParams.get("email") ?? ""

  const [code, setCode] = useState("")
  const [password, setPassword] = useState("")
  const [state, setState] = useState<ResetState>({ status: "idle" })

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setState({ status: "loading" })

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailParam, code, password }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setState({
          status: "error",
          message: (body as { error?: { message?: string } }).error?.message ?? "Invalid or expired code.",
        })
        return
      }

      router.push("/login?reset=1")
    } catch {
      setState({ status: "error", message: "Network error. Please try again." })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-semibold text-text-primary">
          Reset password
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Enter the code from your email and choose a new password.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {state.status === "error" && (
          <div
            role="alert"
            className="rounded-lg border border-red-800 bg-red-950/40 px-4 py-3 text-sm text-red-400"
          >
            {state.message}
          </div>
        )}

        <div className="space-y-1.5">
          <label
            htmlFor="code"
            className="block text-sm font-medium text-text-primary"
          >
            Reset code
          </label>
          <input
            id="code"
            type="text"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            autoComplete="one-time-code"
            required
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            className="w-full min-h-[44px] rounded-lg border border-border bg-surface px-4 py-3 text-center text-xl font-semibold tracking-[0.5em] text-text-primary placeholder:text-text-secondary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="000000"
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="password"
            className="block text-sm font-medium text-text-primary"
          >
            New password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full min-h-[44px] rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="8+ characters"
          />
        </div>

        <button
          type="submit"
          disabled={state.status === "loading" || code.length !== 6}
          className="w-full min-h-[44px] rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-opacity disabled:opacity-50"
        >
          {state.status === "loading" ? "Resetting…" : "Reset password"}
        </button>
      </form>

      <p className="text-center text-sm text-text-secondary">
        <Link
          href="/forgot-password"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Request a new code
        </Link>
        {" · "}
        <Link
          href="/login"
          className="underline-offset-4 hover:underline"
        >
          Back to sign in
        </Link>
      </p>
    </div>
  )
}
