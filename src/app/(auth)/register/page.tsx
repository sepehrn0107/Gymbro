"use client"

import Link from "next/link"
import { useState } from "react"

type RegisterState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success" }
  | { status: "error"; message: string }

export default function RegisterPage() {
  const [displayName, setDisplayName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [state, setState] = useState<RegisterState>({ status: "idle" })

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setState({ status: "loading" })

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: displayName || undefined, email, password }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setState({
          status: "error",
          message: (body as { error?: { message?: string } }).error?.message ?? "Registration failed. Please try again.",
        })
        return
      }

      setState({ status: "success" })
    } catch {
      setState({ status: "error", message: "Network error. Please try again." })
    }
  }

  if (state.status === "success") {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/20">
          <svg
            className="h-7 w-7 text-primary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h2 className="font-heading text-2xl font-semibold text-text-primary">
          Check your email
        </h2>
        <p className="text-sm text-text-secondary">
          We&apos;ve sent a verification code to{" "}
          <span className="font-medium text-text-primary">{email}</span>.
        </p>
        <Link
          href="/verify-email"
          className="mt-4 inline-flex min-h-[44px] w-full items-center justify-center rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground"
        >
          Enter verification code
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-semibold text-text-primary">
          Create account
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Join GymBro and start tracking your workouts.
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
            htmlFor="displayName"
            className="block text-sm font-medium text-text-primary"
          >
            Display name{" "}
            <span className="text-text-secondary">(optional)</span>
          </label>
          <input
            id="displayName"
            type="text"
            autoComplete="name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full min-h-[44px] rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Alex"
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="email"
            className="block text-sm font-medium text-text-primary"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full min-h-[44px] rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="you@example.com"
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="password"
            className="block text-sm font-medium text-text-primary"
          >
            Password
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
          disabled={state.status === "loading"}
          className="w-full min-h-[44px] rounded-lg bg-accent px-4 py-3 text-sm font-semibold text-accent-foreground transition-opacity disabled:opacity-50"
        >
          {state.status === "loading" ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="text-center text-sm text-text-secondary">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  )
}
