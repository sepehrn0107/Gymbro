import { notFound } from "next/navigation"

import { getCurrentUserId } from "@/lib/auth-helpers"
import { getExerciseBySlug } from "@/services/exercise.service"
import { NotFoundError } from "@/lib/errors"

// Force dynamic rendering — user-scoped data must never be statically cached.
export const dynamic = "force-dynamic"

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function ExerciseDetailPage({ params }: PageProps) {
  // Next.js 15: params is a Promise — must await before accessing.
  const { slug } = await params

  const userId = await getCurrentUserId()

  let exercise
  try {
    exercise = await getExerciseBySlug(slug, userId)
  } catch (err) {
    if (err instanceof NotFoundError) {
      notFound()
    }
    throw err
  }

  const isOwner = !exercise.isGlobal && exercise.userId === userId

  return (
    <div className="px-4 py-6">
      {/* Breadcrumb — primary muscle group chain */}
      {exercise.primaryMuscleGroup && (
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-text-secondary">
          {exercise.primaryMuscleGroup.name}
        </p>
      )}

      {/* Exercise name */}
      <h1 className="font-heading text-3xl font-bold leading-tight text-text-primary">
        {exercise.name}
      </h1>

      {/* Badges row */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {/* Exercise type badge */}
        <span className="inline-flex items-center rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
          {exercise.exerciseType.name}
        </span>

        {/* Equipment chip */}
        {exercise.equipment && (
          <span className="inline-flex items-center rounded-full bg-surface-raised px-3 py-1 text-xs font-medium text-text-secondary">
            {exercise.equipment.name}
          </span>
        )}

        {/* Custom badge */}
        {!exercise.isGlobal && (
          <span className="inline-flex items-center rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
            Custom
          </span>
        )}
      </div>

      {/* Secondary muscle groups */}
      {exercise.secondaryMuscleGroups.length > 0 && (
        <div className="mt-4">
          <h2 className="mb-2 font-heading text-sm font-semibold uppercase tracking-wider text-text-secondary">
            Secondary Muscles
          </h2>
          <div className="flex flex-wrap gap-2">
            {exercise.secondaryMuscleGroups.map((mg) => (
              <span
                key={mg.id}
                className="inline-flex items-center rounded-full bg-surface-raised px-3 py-1 text-xs font-medium text-text-primary"
              >
                {mg.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      {exercise.instructions && (
        <div className="mt-6">
          <h2 className="mb-2 font-heading text-sm font-semibold uppercase tracking-wider text-text-secondary">
            Instructions
          </h2>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-text-primary">
            {exercise.instructions}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="mt-8 flex flex-col gap-3">
        {/* TODO: Phase 2 — wire up to workout session */}
        <button
          type="button"
          disabled
          className="flex min-h-[56px] w-full items-center justify-center rounded-xl bg-accent px-6 py-4 font-heading text-lg font-semibold text-accent-foreground opacity-40"
        >
          Start Workout
        </button>

        {/* Owner-only delete action */}
        {isOwner && (
          // TODO: Phase 2 — implement delete with confirmation dialog
          <button
            type="button"
            disabled
            className="flex min-h-[44px] w-full items-center justify-center rounded-xl border border-border px-6 py-2 text-sm font-medium text-text-secondary opacity-40"
          >
            Delete Exercise
          </button>
        )}
      </div>
    </div>
  )
}
