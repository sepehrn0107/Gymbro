import Link from "next/link"
import type { ExerciseListItem } from "@/types/domain"

interface ExerciseCardProps {
  exercise: ExerciseListItem
}

export function ExerciseCard({ exercise }: ExerciseCardProps) {
  return (
    <Link
      href={`/exercises/${exercise.slug}`}
      className="block min-h-[48px] w-full rounded-lg bg-surface p-4 transition-colors hover:bg-surface-raised"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="font-heading text-base font-bold leading-tight text-text-primary">
          {exercise.name}
        </span>

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
          <span className="inline-flex items-center rounded-sm bg-surface-high px-2 py-0.5 font-label text-[10px] font-bold uppercase tracking-widest text-text-secondary">
            {exercise.exerciseType.name}
          </span>

          {!exercise.isGlobal && (
            <span className="inline-flex items-center rounded-sm bg-primary/20 px-2 py-0.5 font-label text-[10px] font-bold uppercase tracking-widest text-primary">
              Custom
            </span>
          )}
        </div>
      </div>

      {(exercise.equipment || exercise.primaryMuscleGroup) && (
        <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 font-label text-[10px] uppercase tracking-widest text-outline">
          {exercise.equipment && <span>{exercise.equipment.name}</span>}
          {exercise.primaryMuscleGroup && (
            <span>{exercise.primaryMuscleGroup.name}</span>
          )}
        </div>
      )}
    </Link>
  )
}
