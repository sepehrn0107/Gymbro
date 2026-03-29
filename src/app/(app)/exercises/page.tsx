import Link from "next/link"
import { notFound } from "next/navigation"

import { getCurrentUserId } from "@/lib/auth-helpers"
import { listExercises } from "@/services/exercise.service"
import { getAllMuscleGroups } from "@/services/lookup.service"
import { exerciseQuerySchema } from "@/lib/validations/exercises"
import { ExerciseList } from "@/components/exercises/ExerciseList"
import { ExerciseSearchBar } from "@/components/exercises/ExerciseSearchBar"
import { MuscleGroupFilter } from "@/components/exercises/MuscleGroupFilter"
import { ExercisePageControls } from "@/components/exercises/ExercisePageControls"

// Force dynamic rendering — user-scoped data must never be statically cached.
export const dynamic = "force-dynamic"

interface PageProps {
  searchParams: Promise<{
    q?: string
    muscleGroupId?: string
    exerciseTypeId?: string
    equipmentId?: string
    page?: string
  }>
}

export default async function ExercisesPage({ searchParams }: PageProps) {
  // Next.js 15: searchParams is a Promise — must await before accessing.
  const params = await searchParams

  // Parse and validate query params (applies defaults for page/pageSize).
  const parseResult = exerciseQuerySchema.safeParse({
    q: params.q,
    muscleGroupId: params.muscleGroupId,
    exerciseTypeId: params.exerciseTypeId,
    equipmentId: params.equipmentId,
    page: params.page,
  })

  if (!parseResult.success) {
    // Invalid query params — treat as empty query with defaults.
  }

  const query = parseResult.success
    ? parseResult.data
    : exerciseQuerySchema.parse({})

  const userId = await getCurrentUserId()

  // Fetch exercises and muscle groups in parallel.
  const [result, muscleGroups] = await Promise.all([
    listExercises(userId, query),
    getAllMuscleGroups(),
  ])

  const { items, total, page, pageSize } = result
  const startItem = total === 0 ? 0 : (page - 1) * pageSize + 1
  const endItem = Math.min(page * pageSize, total)
  const totalPages = Math.ceil(total / pageSize)
  const hasPrev = page > 1
  const hasNext = page < totalPages

  // Build URL helper — preserves existing params, updates specific keys.
  function buildUrl(overrides: Record<string, string | undefined>): string {
    const merged: Record<string, string> = {}
    if (params.q) merged.q = params.q
    if (params.muscleGroupId) merged.muscleGroupId = params.muscleGroupId
    if (params.exerciseTypeId) merged.exerciseTypeId = params.exerciseTypeId
    if (params.equipmentId) merged.equipmentId = params.equipmentId
    if (params.page) merged.page = params.page
    for (const [k, v] of Object.entries(overrides)) {
      if (v === undefined || v === "") {
        delete merged[k]
      } else {
        merged[k] = v
      }
    }
    const qs = new URLSearchParams(merged).toString()
    return qs ? `/exercises?${qs}` : "/exercises"
  }

  return (
    <div className="px-4 py-6">
      {/* Page header */}
      <header className="mb-6 flex items-center justify-between">
        <h1 className="font-heading text-3xl font-bold text-text-primary">
          Exercises
        </h1>
        <Link
          href="/exercises/new"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-xl font-bold text-accent-foreground shadow transition-opacity active:opacity-80"
          aria-label="Create new exercise"
        >
          +
        </Link>
      </header>

      {/* Filters */}
      <div className="mb-4 flex flex-col gap-3">
        <ExercisePageControls
          initialQ={params.q ?? ""}
          muscleGroupId={params.muscleGroupId ?? null}
          muscleGroups={muscleGroups}
          baseUrl="/exercises"
          currentParams={{
            q: params.q,
            muscleGroupId: params.muscleGroupId,
            exerciseTypeId: params.exerciseTypeId,
            equipmentId: params.equipmentId,
            page: params.page,
          }}
        />
      </div>

      {/* Results summary */}
      {total > 0 && (
        <p className="mb-3 text-xs text-text-secondary">
          Showing {startItem}–{endItem} of {total}
        </p>
      )}

      {/* Exercise list */}
      <ExerciseList
        exercises={items}
        emptyMessage="No exercises found. Try adjusting your search or filters."
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <nav
          className="mt-6 flex items-center justify-between gap-4"
          aria-label="Pagination"
        >
          {hasPrev ? (
            <Link
              href={buildUrl({ page: String(page - 1) })}
              className="flex min-h-[44px] items-center rounded-lg bg-surface-raised px-4 py-2 text-sm font-medium text-text-primary transition-opacity active:opacity-70"
            >
              Previous
            </Link>
          ) : (
            <span className="flex min-h-[44px] items-center rounded-lg bg-surface px-4 py-2 text-sm font-medium text-text-secondary opacity-50">
              Previous
            </span>
          )}

          <span className="text-xs text-text-secondary">
            Page {page} of {totalPages}
          </span>

          {hasNext ? (
            <Link
              href={buildUrl({ page: String(page + 1) })}
              className="flex min-h-[44px] items-center rounded-lg bg-surface-raised px-4 py-2 text-sm font-medium text-text-primary transition-opacity active:opacity-70"
            >
              Next
            </Link>
          ) : (
            <span className="flex min-h-[44px] items-center rounded-lg bg-surface px-4 py-2 text-sm font-medium text-text-secondary opacity-50">
              Next
            </span>
          )}
        </nav>
      )}
    </div>
  )
}
