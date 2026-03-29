import { describe, it, expect, vi, beforeEach } from "vitest"

// ── Mocks (hoisted before imports) ───────────────────────────────────────────

vi.mock("@/lib/auth-helpers", () => ({
  requireSession: vi.fn(),
}))

vi.mock("@/services/lookup.service", () => ({
  getAllMuscleGroups: vi.fn(),
  getAllExerciseTypes: vi.fn(),
  getAllEquipment: vi.fn(),
}))

import { requireSession } from "@/lib/auth-helpers"
import { getAllMuscleGroups } from "@/services/lookup.service"
import { UnauthorizedError } from "@/lib/errors"

// ── Helpers ───────────────────────────────────────────────────────────────────

const MOCK_SESSION = { user: { id: "user-123", email: "test@example.com" } }

const MOCK_MUSCLE_GROUPS = [
  { id: "mg-1", name: "Chest", slug: "chest", parentId: null },
  { id: "mg-2", name: "Pectoralis Major", slug: "pectoralis-major", parentId: "mg-1" },
]

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("GET /api/muscle-groups", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should return 401 when no session exists", async () => {
    vi.mocked(requireSession).mockRejectedValue(
      new UnauthorizedError("Authentication required"),
    )

    const { GET } = await import("../route")
    const res = await GET()
    const json = await res.json()

    expect(res.status).toBe(401)
    expect(json.success).toBe(false)
    expect(json.error.code).toBe("UNAUTHORIZED")
  })

  it("should return 200 with an array of muscle groups when session is valid", async () => {
    vi.mocked(requireSession).mockResolvedValue(MOCK_SESSION as never)
    vi.mocked(getAllMuscleGroups).mockResolvedValue(MOCK_MUSCLE_GROUPS)

    const { GET } = await import("../route")
    const res = await GET()
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(Array.isArray(json.data)).toBe(true)
    expect(json.data).toHaveLength(2)
  })

  it("should include id, name, slug, and parentId fields in each item", async () => {
    vi.mocked(requireSession).mockResolvedValue(MOCK_SESSION as never)
    vi.mocked(getAllMuscleGroups).mockResolvedValue(MOCK_MUSCLE_GROUPS)

    const { GET } = await import("../route")
    const res = await GET()
    const json = await res.json()

    const first = json.data[0]
    expect(first).toHaveProperty("id")
    expect(first).toHaveProperty("name")
    expect(first).toHaveProperty("slug")
    expect(first).toHaveProperty("parentId")
  })

  it("should return an empty array when no muscle groups exist", async () => {
    vi.mocked(requireSession).mockResolvedValue(MOCK_SESSION as never)
    vi.mocked(getAllMuscleGroups).mockResolvedValue([])

    const { GET } = await import("../route")
    const res = await GET()
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.data).toEqual([])
  })
})
