"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

type VerifyState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "resent" }

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const emailParam = searchParams.get("email") ?? ""

  const [code, setCode] = useState("")
  const [state, setState] = useState<VerifyState>({ status: "idle" })

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setState({ status: "loading" })

    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailParam, code }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setState({
          status: "error",
          message: (body as { error?: { message?: string } }).error?.message ?? "Invalid or expired code.",
        })
        return
      }

      router.push("/login?verified=1")
    } catch {
      setState({ status: "error", message: "Network error. Please try again." })
    }
  }

  function handleResend() {
    // Future: call POST /api/auth/resend-verification
    setState({ status: "resent" })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-semibold text-text-primary">
          Verify your email
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Enter the 6-digit code we sent
          {emailParam ? (
            <>
              {" "}to{" "}
              <span className="font-medium text-text-primary">{emailParam}</span>
            </>
          ) : (
            " to your email"
          )}
          .
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

        {state.status === "resent" && (
          <div
            role="status"
            className="rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary"
          >
            Resend coming soon — check your original email.
          </div>
        )}

        <div className="space-y-1.5">
          <label
            htmlFor="code"
            className="block text-sm font-medium text-text-primary"
          >
            Verification code
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

        <button
          type="submit"
          disabled={state.status === "loading" || code.length !== 6}
          className="w-full min-h-[44px] rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-opacity disabled:opacity-50"
        >
          {state.status === "loading" ? "Verifying…" : "Verify email"}
        </button>
      </form>

      <div className="flex items-center justify-between text-sm">
        <button
          type="button"
          onClick={handleResend}
          className="text-text-secondary underline-offset-4 hover:underline"
        >
          Resend code
        </button>
        <Link
          href="/login"
          className="text-primary underline-offset-4 hover:underline"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  )
}
