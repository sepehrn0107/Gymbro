import { describe, it, expect, vi, beforeEach } from "vitest"

// ── Mocks (hoisted before imports) ───────────────────────────────────────────

vi.mock("@/lib/auth-helpers", () => ({
  requireSession: vi.fn(),
}))

vi.mock("@/services/exercise.service", () => ({
  getExerciseById: vi.fn(),
}))

import { requireSession } from "@/lib/auth-helpers"
import { getExerciseById } from "@/services/exercise.service"
import { NotFoundError, UnauthorizedError } from "@/lib/errors"

// ── Helpers ───────────────────────────────────────────────────────────────────

const MOCK_SESSION = { user: { id: "user-123", email: "test@example.com" } }

function makeGetRequest(id: string) {
  return new Request(`http://localhost/api/exercises/${id}`, { method: "GET" })
}

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) }
}

const MOCK_EXERCISE_DETAIL = {
  id: "ex-global-1",
  name: "Bench Press",
  slug: "bench-press",
  isGlobal: true,
  exerciseType: { id: "et-1", name: "Strength" },
  equipment: { id: "eq-1", name: "Barbell" },
  primaryMuscleGroup: null,
  instructions: "Press the bar off your chest.",
  secondaryMuscleGroups: [],
  userId: null,
  createdAt: new Date("2026-01-01"),
}

const MOCK_CUSTOM_EXERCISE = {
  ...MOCK_EXERCISE_DETAIL,
  id: "ex-custom-1",
  name: "Custom Curl",
  slug: "custom-curl-a3f9",
  isGlobal: false,
  userId: "user-123",
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("GET /api/exercises/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should return 401 when no session exists", async () => {
    vi.mocked(requireSession).mockRejectedValue(
      new UnauthorizedError("Authentication required"),
    )

    const { GET } = await import("../route")
    const res = await GET(makeGetRequest("ex-global-1"), makeParams("ex-global-1"))
    const json = await res.json()

    expect(res.status).toBe(401)
    expect(json.success).toBe(false)
    expect(json.error.code).toBe("UNAUTHORIZED")
  })

  it("should return 404 for an unknown exercise ID", async () => {
    vi.mocked(requireSession).mockResolvedValue(MOCK_SESSION as never)
    vi.mocked(getExerciseById).mockRejectedValue(
      new NotFoundError("Exercise not found"),
    )

    const { GET } = await import("../route")
    const res = await GET(makeGetRequest("unknown-id"), makeParams("unknown-id"))
    const json = await res.json()

    expect(res.status).toBe(404)
    expect(json.error.code).toBe("NOT_FOUND")
  })

  it("should return 404 (not 403) for another user's custom exercise", async () => {
    vi.mocked(requireSession).mockResolvedValue(MOCK_SESSION as never)
    vi.mocked(getExerciseById).mockRejectedValue(
      new NotFoundError("Exercise not found"),
    )

    const { GET } = await import("../route")
    const res = await GET(
      makeGetRequest("ex-other-user"),
      makeParams("ex-other-user"),
    )
    const json = await res.json()

    // Must be 404, not 403 — do not leak existence
    expect(res.status).toBe(404)
    expect(json.error.code).toBe("NOT_FOUND")
  })

  it("should return 200 for a global exercise", async () => {
    vi.mocked(requireSession).mockResolvedValue(MOCK_SESSION as never)
    vi.mocked(getExerciseById).mockResolvedValue(MOCK_EXERCISE_DETAIL)

    const { GET } = await import("../route")
    const res = await GET(makeGetRequest("ex-global-1"), makeParams("ex-global-1"))
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.data.id).toBe("ex-global-1")
    expect(json.data.isGlobal).toBe(true)
  })

  it("should return 200 for the user's own custom exercise", async () => {
    vi.mocked(requireSession).mockResolvedValue(MOCK_SESSION as never)
    vi.mocked(getExerciseById).mockResolvedValue(MOCK_CUSTOM_EXERCISE)

    const { GET } = await import("../route")
    const res = await GET(makeGetRequest("ex-custom-1"), makeParams("ex-custom-1"))
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.data.isGlobal).toBe(false)
    expect(json.data.userId).toBe("user-123")
  })

  it("should call getExerciseById with the correct id and userId", async () => {
    vi.mocked(requireSession).mockResolvedValue(MOCK_SESSION as never)
    vi.mocked(getExerciseById).mockResolvedValue(MOCK_EXERCISE_DETAIL)

    const { GET } = await import("../route")
    await GET(makeGetRequest("ex-global-1"), makeParams("ex-global-1"))

    expect(getExerciseById).toHaveBeenCalledWith("ex-global-1", "user-123")
  })
})
