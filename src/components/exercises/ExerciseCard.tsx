import Link from "next/link"
import type { ExerciseListItem } from "@/types/domain"

interface ExerciseCardProps {
  exercise: ExerciseListItem
}

export function ExerciseCard({ exercise }: ExerciseCardProps) {
  return (
    <Link
      href={`/exercises/${exercise.slug}`}
      className="block min-h-[48px] w-full rounded-xl bg-surface p-4 transition-colors hover:bg-surface-raised"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="truncate font-heading text-base font-semibold leading-tight text-text-primary">
          {exercise.name}
        </span>

        <div className="flex shrink-0 items-center gap-1.5">
          <span className="inline-flex items-center rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
            {exercise.exerciseType.name}
          </span>

          {!exercise.isGlobal && (
            <span className="inline-flex items-center rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
              Custom
            </span>
          )}
        </div>
      </div>

      {(exercise.equipment || exercise.primaryMuscleGroup) && (
        <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-text-secondary">
          {exercise.equipment && <span>{exercise.equipment.name}</span>}
          {exercise.primaryMuscleGroup && (
            <span>{exercise.primaryMuscleGroup.name}</span>
          )}
        </div>
      )}
    </Link>
  )
}
