import { describe, it, expect, vi, beforeEach } from "vitest"

// ── Mocks (hoisted before any imports) ───────────────────────────────────────

// We mock the entire @/db module so no real DB connection is needed.
// The mock is a plain object; individual tests override methods via vi.fn().
vi.mock("@/db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/db")>()
  return {
    // Keep the real schema export so the service can destructure table references.
    schema: actual.schema,
    db: {
      query: {
        exercises: {
          findFirst: vi.fn(),
        },
      },
      select: vi.fn(),
      insert: vi.fn(),
      transaction: vi.fn(),
    },
  }
})

// Mock slug generation so we can assert deterministic values in tests.
vi.mock("@/lib/slug", () => ({
  generateCustomSlug: vi.fn().mockReturnValue("bench-press-abcd"),
}))

import { db } from "@/db"
import { generateCustomSlug } from "@/lib/slug"
import { NotFoundError, ConflictError } from "@/lib/errors"
import {
  listExercises,
  getExerciseById,
  getExerciseBySlug,
  createExercise,
} from "@/services/exercise.service"

// ── Test fixtures ─────────────────────────────────────────────────────────────

const USER_ID = "user-000-0000-0000-000000000001"
const OTHER_USER_ID = "user-000-0000-0000-000000000002"
const EXERCISE_ID = "exer-000-0000-0000-000000000001"
const EXERCISE_TYPE_ID = "type-000-0000-0000-000000000001"

const globalExercise = {
  id: EXERCISE_ID,
  name: "Bench Press",
  slug: "bench-press",
  isGlobal: true,
  userId: null,
  exerciseTypeId: EXERCISE_TYPE_ID,
  equipmentId: null,
  primaryMuscleGroupId: null,
  instructions: null,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
  exerciseType: { id: EXERCISE_TYPE_ID, name: "Strength" },
  equipment: null,
  primaryMuscleGroup: null,
  secondaryMuscles: [],
}

const customExercise = {
  ...globalExercise,
  id: "exer-000-0000-0000-000000000002",
  slug: "my-exercise-a1b2",
  isGlobal: false,
  userId: USER_ID,
}

// Helper to build a select chain mock that resolves to a value
function buildSelectChain(rows: unknown[]) {
  const chain = {
    from: vi.fn(),
    leftJoin: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
    offset: vi.fn(),
  }
  chain.from.mockReturnValue(chain)
  chain.leftJoin.mockReturnValue(chain)
  chain.where.mockReturnValue(chain)
  chain.orderBy.mockReturnValue(chain)
  chain.limit.mockReturnValue(chain)
  chain.offset.mockResolvedValue(rows)
  vi.mocked(db.select).mockReturnValue(chain as never)
  return chain
}

// ── listExercises ──────────────────────────────────────────────────────────────

describe("listExercises", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should return paginated results with total", async () => {
    // First call: count query, second call: data query
    const countChain = {
      from: vi.fn(),
      where: vi.fn(),
    }
    countChain.from.mockReturnValue(countChain)
    countChain.where.mockResolvedValue([{ count: "5" }])

    const dataChain = {
      from: vi.fn(),
      leftJoin: vi.fn(),
      where: vi.fn(),
      orderBy: vi.fn(),
      limit: vi.fn(),
      offset: vi.fn(),
    }
    dataChain.from.mockReturnValue(dataChain)
    dataChain.leftJoin.mockReturnValue(dataChain)
    dataChain.where.mockReturnValue(dataChain)
    dataChain.orderBy.mockReturnValue(dataChain)
    dataChain.limit.mockReturnValue(dataChain)
    dataChain.offset.mockResolvedValue([
      {
        exercise: globalExercise,
        exerciseType: globalExercise.exerciseType,
        equipment: null,
        primaryMuscleGroup: null,
      },
    ])

    vi.mocked(db.select)
      .mockReturnValueOnce(countChain as never)
      .mockReturnValueOnce(dataChain as never)

    const result = await listExercises(USER_ID, { page: 1, pageSize: 20 })

    expect(result.total).toBe(5)
    expect(result.page).toBe(1)
    expect(result.pageSize).toBe(20)
    expect(result.items).toHaveLength(1)
    expect(result.items[0]?.name).toBe("Bench Press")
  })

  it("should pass userId to scope the query", async () => {
    const countChain = { from: vi.fn(), where: vi.fn() }
    countChain.from.mockReturnValue(countChain)
    countChain.where.mockResolvedValue([{ count: "0" }])

    const dataChain = {
      from: vi.fn(),
      leftJoin: vi.fn(),
      where: vi.fn(),
      orderBy: vi.fn(),
      limit: vi.fn(),
      offset: vi.fn(),
    }
    dataChain.from.mockReturnValue(dataChain)
    dataChain.leftJoin.mockReturnValue(dataChain)
    dataChain.where.mockReturnValue(dataChain)
    dataChain.orderBy.mockReturnValue(dataChain)
    dataChain.limit.mockReturnValue(dataChain)
    dataChain.offset.mockResolvedValue([])

    vi.mocked(db.select)
      .mockReturnValueOnce(countChain as never)
      .mockReturnValueOnce(dataChain as never)

    const result = await listExercises(USER_ID, { page: 1, pageSize: 20 })

    expect(result.total).toBe(0)
    expect(result.items).toHaveLength(0)
    // The where clause is called on both chains — verifies the filter was applied
    expect(countChain.where).toHaveBeenCalled()
    expect(dataChain.where).toHaveBeenCalled()
  })

  it("should use page and pageSize from query for pagination", async () => {
    const countChain = { from: vi.fn(), where: vi.fn() }
    countChain.from.mockReturnValue(countChain)
    countChain.where.mockResolvedValue([{ count: "100" }])

    const dataChain = {
      from: vi.fn(),
      leftJoin: vi.fn(),
      where: vi.fn(),
      orderBy: vi.fn(),
      limit: vi.fn(),
      offset: vi.fn(),
    }
    dataChain.from.mockReturnValue(dataChain)
    dataChain.leftJoin.mockReturnValue(dataChain)
    dataChain.where.mockReturnValue(dataChain)
    dataChain.orderBy.mockReturnValue(dataChain)
    dataChain.limit.mockReturnValue(dataChain)
    dataChain.offset.mockResolvedValue([])

    vi.mocked(db.select)
      .mockReturnValueOnce(countChain as never)
      .mockReturnValueOnce(dataChain as never)

    const result = await listExercises(USER_ID, { page: 3, pageSize: 10 })

    expect(result.page).toBe(3)
    expect(result.pageSize).toBe(10)
    expect(dataChain.limit).toHaveBeenCalledWith(10)
    expect(dataChain.offset).toHaveBeenCalledWith(20) // (3-1) * 10
  })
})

// ── getExerciseById ────────────────────────────────────────────────────────────

describe("getExerciseById", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should return exercise detail for a global exercise", async () => {
    vi.mocked(db.query.exercises.findFirst).mockResolvedValue({
      ...globalExercise,
      secondaryMuscles: [],
    } as never)

    const result = await getExerciseById(EXERCISE_ID, USER_ID)

    expect(result.id).toBe(EXERCISE_ID)
    expect(result.name).toBe("Bench Press")
    expect(result.isGlobal).toBe(true)
  })

  it("should return exercise detail for a user's own custom exercise", async () => {
    vi.mocked(db.query.exercises.findFirst).mockResolvedValue({
      ...customExercise,
      secondaryMuscles: [],
    } as never)

    const result = await getExerciseById(customExercise.id, USER_ID)

    expect(result.id).toBe(customExercise.id)
    expect(result.isGlobal).toBe(false)
    expect(result.userId).toBe(USER_ID)
  })

  it("should throw NotFoundError when exercise does not exist", async () => {
    vi.mocked(db.query.exercises.findFirst).mockResolvedValue(undefined as never)

    await expect(getExerciseById("nonexistent-id", USER_ID)).rejects.toThrow(NotFoundError)
  })

  it("should throw NotFoundError (not ForbiddenError) when exercise belongs to a different user", async () => {
    vi.mocked(db.query.exercises.findFirst).mockResolvedValue({
      ...customExercise,
      userId: OTHER_USER_ID,
      secondaryMuscles: [],
    } as never)

    await expect(getExerciseById(customExercise.id, USER_ID)).rejects.toThrow(NotFoundError)
  })

  it("should map secondaryMuscles from junction rows correctly", async () => {
    vi.mocked(db.query.exercises.findFirst).mockResolvedValue({
      ...globalExercise,
      secondaryMuscles: [
        {
          muscleGroup: {
            id: "mg-001",
            name: "Triceps",
            slug: "triceps",
            parentId: null,
          },
        },
      ],
    } as never)

    const result = await getExerciseById(EXERCISE_ID, USER_ID)

    expect(result.secondaryMuscleGroups).toHaveLength(1)
    expect(result.secondaryMuscleGroups[0]?.name).toBe("Triceps")
  })
})

// ── getExerciseBySlug ──────────────────────────────────────────────────────────

describe("getExerciseBySlug", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should return exercise detail when found by slug", async () => {
    vi.mocked(db.query.exercises.findFirst).mockResolvedValue({
      ...globalExercise,
      secondaryMuscles: [],
    } as never)

    const result = await getExerciseBySlug("bench-press", USER_ID)

    expect(result.slug).toBe("bench-press")
  })

  it("should throw NotFoundError when no exercise matches the slug", async () => {
    vi.mocked(db.query.exercises.findFirst).mockResolvedValue(undefined as never)

    await expect(getExerciseBySlug("unknown-slug-xxxx", USER_ID)).rejects.toThrow(NotFoundError)
  })

  it("should throw NotFoundError when slug matches another user's custom exercise", async () => {
    vi.mocked(db.query.exercises.findFirst).mockResolvedValue({
      ...customExercise,
      slug: "my-exercise-a1b2",
      userId: OTHER_USER_ID,
      secondaryMuscles: [],
    } as never)

    await expect(getExerciseBySlug("my-exercise-a1b2", USER_ID)).rejects.toThrow(NotFoundError)
  })
})

// ── createExercise ─────────────────────────────────────────────────────────────

describe("createExercise", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(generateCustomSlug).mockReturnValue("bench-press-abcd")
  })

  it("should always set isGlobal=false and userId on the inserted row", async () => {
    // Transaction mock: executes the callback immediately
    vi.mocked(db.transaction).mockImplementation(async (fn) => {
      const txMock = {
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{ id: EXERCISE_ID }]),
          }),
        }),
        query: {
          exercises: {
            findFirst: vi.fn().mockResolvedValue({
              ...globalExercise,
              isGlobal: false,
              userId: USER_ID,
              secondaryMuscles: [],
            }),
          },
        },
      }
      return fn(txMock as never)
    })

    const result = await createExercise(USER_ID, {
      name: "Bench Press",
      exerciseTypeId: EXERCISE_TYPE_ID,
      secondaryMuscleGroupIds: [],
    })

    expect(result.isGlobal).toBe(false)
    expect(result.userId).toBe(USER_ID)
  })

  it("should generate a slug via generateCustomSlug", async () => {
    vi.mocked(generateCustomSlug).mockReturnValue("bench-press-abcd")

    let capturedValues: Record<string, unknown> | undefined

    vi.mocked(db.transaction).mockImplementation(async (fn) => {
      const txMock = {
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockImplementation((vals) => {
            capturedValues = vals as Record<string, unknown>
            return {
              returning: vi.fn().mockResolvedValue([{ id: EXERCISE_ID }]),
            }
          }),
        }),
        query: {
          exercises: {
            findFirst: vi.fn().mockResolvedValue({
              ...globalExercise,
              slug: "bench-press-abcd",
              isGlobal: false,
              userId: USER_ID,
              secondaryMuscles: [],
            }),
          },
        },
      }
      return fn(txMock as never)
    })

    await createExercise(USER_ID, {
      name: "Bench Press",
      exerciseTypeId: EXERCISE_TYPE_ID,
      secondaryMuscleGroupIds: [],
    })

    expect(generateCustomSlug).toHaveBeenCalledWith("Bench Press")
    expect(capturedValues?.slug).toBe("bench-press-abcd")
  })

  it("should insert secondary muscle rows inside the transaction", async () => {
    const secondaryIds = ["mg-001", "mg-002"]
    const insertMock = vi.fn()

    vi.mocked(db.transaction).mockImplementation(async (fn) => {
      let insertCallCount = 0
      const txMock = {
        insert: vi.fn().mockImplementation(() => {
          insertCallCount++
          return {
            values: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValue(
                insertCallCount === 1 ? [{ id: EXERCISE_ID }] : [],
              ),
            }),
          }
        }),
        query: {
          exercises: {
            findFirst: vi.fn().mockResolvedValue({
              ...globalExercise,
              isGlobal: false,
              userId: USER_ID,
              secondaryMuscles: secondaryIds.map((mgId) => ({
                muscleGroup: { id: mgId, name: "Muscle", slug: "muscle", parentId: null },
              })),
            }),
          },
        },
      }
      insertMock.mockImplementation(txMock.insert)
      return fn(txMock as never)
    })

    const result = await createExercise(USER_ID, {
      name: "Bench Press",
      exerciseTypeId: EXERCISE_TYPE_ID,
      secondaryMuscleGroupIds: secondaryIds,
    })

    expect(result.secondaryMuscleGroups).toHaveLength(2)
  })

  it("should retry once on slug collision (pg error 23505) and succeed on second attempt", async () => {
    let callCount = 0
    vi.mocked(generateCustomSlug)
      .mockReturnValueOnce("bench-press-aaaa")
      .mockReturnValueOnce("bench-press-bbbb")

    vi.mocked(db.transaction).mockImplementation(async (fn) => {
      callCount++
      if (callCount === 1) {
        // Simulate unique constraint violation
        const pgError = Object.assign(new Error("unique violation"), { code: "23505" })
        throw pgError
      }
      const txMock = {
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{ id: EXERCISE_ID }]),
          }),
        }),
        query: {
          exercises: {
            findFirst: vi.fn().mockResolvedValue({
              ...globalExercise,
              slug: "bench-press-bbbb",
              isGlobal: false,
              userId: USER_ID,
              secondaryMuscles: [],
            }),
          },
        },
      }
      return fn(txMock as never)
    })

    const result = await createExercise(USER_ID, {
      name: "Bench Press",
      exerciseTypeId: EXERCISE_TYPE_ID,
      secondaryMuscleGroupIds: [],
    })

    expect(generateCustomSlug).toHaveBeenCalledTimes(2)
    expect(result.slug).toBe("bench-press-bbbb")
  })

  it("should throw ConflictError if both slug attempts collide", async () => {
    vi.mocked(generateCustomSlug)
      .mockReturnValueOnce("bench-press-aaaa")
      .mockReturnValueOnce("bench-press-bbbb")

    const pgError = Object.assign(new Error("unique violation"), { code: "23505" })
    vi.mocked(db.transaction).mockRejectedValue(pgError)

    await expect(
      createExercise(USER_ID, {
        name: "Bench Press",
        exerciseTypeId: EXERCISE_TYPE_ID,
        secondaryMuscleGroupIds: [],
      }),
    ).rejects.toThrow(ConflictError)
  })
})
