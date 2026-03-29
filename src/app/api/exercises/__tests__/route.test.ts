import { describe, it, expect, vi, beforeEach } from "vitest"

// ── Mocks (hoisted before imports) ───────────────────────────────────────────

vi.mock("@/lib/auth-helpers", () => ({
  requireSession: vi.fn(),
}))

vi.mock("@/services/exercise.service", () => ({
  listExercises: vi.fn(),
  createExercise: vi.fn(),
}))

import { requireSession } from "@/lib/auth-helpers"
import { listExercises, createExercise } from "@/services/exercise.service"
import { UnauthorizedError } from "@/lib/errors"

// ── Helpers ───────────────────────────────────────────────────────────────────

const MOCK_SESSION = { user: { id: "user-123", email: "test@example.com" } }

function makeGetRequest(searchParams: Record<string, string> = {}) {
  const url = new URL("http://localhost/api/exercises")
  for (const [key, value] of Object.entries(searchParams)) {
    url.searchParams.set(key, value)
  }
  return new Request(url.toString(), { method: "GET" })
}

function makePostRequest(body: unknown) {
  return new Request("http://localhost/api/exercises", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

const MOCK_LIST_RESULT = {
  items: [
    {
      id: "ex-1",
      name: "Bench Press",
      slug: "bench-press",
      isGlobal: true,
      exerciseType: { id: "et-1", name: "Strength" },
      equipment: { id: "eq-1", name: "Barbell" },
      primaryMuscleGroup: null,
    },
  ],
  total: 1,
  page: 1,
  pageSize: 20,
}

const MOCK_EXERCISE_DETAIL = {
  id: "ex-2",
  name: "Custom Curl",
  slug: "custom-curl-a3f9",
  isGlobal: false,
  exerciseType: { id: "et-1", name: "Strength" },
  equipment: null,
  primaryMuscleGroup: null,
  instructions: null,
  secondaryMuscleGroups: [],
  userId: "user-123",
  createdAt: new Date("2026-01-01"),
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("GET /api/exercises", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should return 401 when no session exists", async () => {
    vi.mocked(requireSession).mockRejectedValue(
      new UnauthorizedError("Authentication required"),
    )

    const { GET } = await import("../route")
    const req = makeGetRequest()
    const res = await GET(req)
    const json = await res.json()

    expect(res.status).toBe(401)
    expect(json.success).toBe(false)
    expect(json.error.code).toBe("UNAUTHORIZED")
  })

  it("should return 200 with paginated exercises when session is valid", async () => {
    vi.mocked(requireSession).mockResolvedValue(MOCK_SESSION as never)
    vi.mocked(listExercises).mockResolvedValue(MOCK_LIST_RESULT)

    const { GET } = await import("../route")
    const req = makeGetRequest()
    const res = await GET(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.data.items).toHaveLength(1)
    expect(json.data.total).toBe(1)
    expect(json.data.page).toBe(1)
    expect(json.data.pageSize).toBe(20)
  })

  it("should pass filters to listExercises", async () => {
    vi.mocked(requireSession).mockResolvedValue(MOCK_SESSION as never)
    vi.mocked(listExercises).mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      pageSize: 20,
    })

    const { GET } = await import("../route")
    const muscleGroupId = "6ba7b810-9dad-11d1-80b4-00c04fd430c8"
    const req = makeGetRequest({ q: "squat", muscleGroupId, page: "2", pageSize: "10" })
    const res = await GET(req)

    expect(res.status).toBe(200)
    expect(listExercises).toHaveBeenCalledWith("user-123", {
      q: "squat",
      muscleGroupId,
      page: 2,
      pageSize: 10,
    })
  })

  it("should return 422 on invalid query parameters", async () => {
    vi.mocked(requireSession).mockResolvedValue(MOCK_SESSION as never)

    const { GET } = await import("../route")
    const req = makeGetRequest({ page: "-1" })
    const res = await GET(req)
    const json = await res.json()

    expect(res.status).toBe(422)
    expect(json.success).toBe(false)
    expect(json.error.code).toBe("VALIDATION_ERROR")
  })

  it("should return 422 when muscleGroupId is not a valid UUID", async () => {
    vi.mocked(requireSession).mockResolvedValue(MOCK_SESSION as never)

    const { GET } = await import("../route")
    const req = makeGetRequest({ muscleGroupId: "not-a-uuid" })
    const res = await GET(req)
    const json = await res.json()

    expect(res.status).toBe(422)
    expect(json.success).toBe(false)
  })
})

describe("POST /api/exercises", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should return 401 when no session exists", async () => {
    vi.mocked(requireSession).mockRejectedValue(
      new UnauthorizedError("Authentication required"),
    )

    const { POST } = await import("../route")
    const req = makePostRequest({ name: "Squat" })
    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(401)
    expect(json.error.code).toBe("UNAUTHORIZED")
  })

  it("should return 422 on invalid body — missing name", async () => {
    vi.mocked(requireSession).mockResolvedValue(MOCK_SESSION as never)

    const { POST } = await import("../route")
    const req = makePostRequest({
      exerciseTypeId: "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
    })
    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(422)
    expect(json.error.code).toBe("VALIDATION_ERROR")
    expect(json.error.fields).toHaveProperty("name")
  })

  it("should return 422 on invalid body — invalid UUID for exerciseTypeId", async () => {
    vi.mocked(requireSession).mockResolvedValue(MOCK_SESSION as never)

    const { POST } = await import("../route")
    const req = makePostRequest({ name: "My Exercise", exerciseTypeId: "not-a-uuid" })
    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(422)
    expect(json.error.code).toBe("VALIDATION_ERROR")
  })

  it("should return 422 when secondaryMuscleGroupIds exceeds 10 items", async () => {
    vi.mocked(requireSession).mockResolvedValue(MOCK_SESSION as never)

    const { POST } = await import("../route")
    const tooManyIds = Array.from({ length: 11 }, () => "6ba7b810-9dad-11d1-80b4-00c04fd430c8")
    const req = makePostRequest({
      name: "Test",
      exerciseTypeId: "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
      secondaryMuscleGroupIds: tooManyIds,
    })
    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(422)
    expect(json.error.code).toBe("VALIDATION_ERROR")
  })

  it("should return 201 with created exercise on valid body", async () => {
    vi.mocked(requireSession).mockResolvedValue(MOCK_SESSION as never)
    vi.mocked(createExercise).mockResolvedValue(MOCK_EXERCISE_DETAIL)

    const { POST } = await import("../route")
    const req = makePostRequest({
      name: "Custom Curl",
      exerciseTypeId: "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
    })
    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(201)
    expect(json.success).toBe(true)
    expect(json.data.isGlobal).toBe(false)
    expect(json.data.userId).toBe("user-123")
    expect(json.data.name).toBe("Custom Curl")
  })

  it("should call createExercise with correct userId from session", async () => {
    vi.mocked(requireSession).mockResolvedValue(MOCK_SESSION as never)
    vi.mocked(createExercise).mockResolvedValue(MOCK_EXERCISE_DETAIL)

    const { POST } = await import("../route")
    const body = {
      name: "Custom Curl",
      exerciseTypeId: "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
    }
    const req = makePostRequest(body)
    await POST(req)

    expect(createExercise).toHaveBeenCalledWith("user-123", {
      name: "Custom Curl",
      exerciseTypeId: "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
      equipmentId: undefined,
      primaryMuscleGroupId: undefined,
      secondaryMuscleGroupIds: [],
      instructions: undefined,
    })
  })
})
