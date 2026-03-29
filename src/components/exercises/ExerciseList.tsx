import type { ExerciseListItem } from "@/types/domain"
import { ExerciseCard } from "./ExerciseCard"

interface ExerciseListProps {
  exercises: ExerciseListItem[]
  emptyMessage?: string
}

export function ExerciseList({
  exercises,
  emptyMessage = "No exercises found",
}: ExerciseListProps) {
  if (exercises.length === 0) {
    return (
      <div className="flex w-full items-center justify-center py-12">
        <p className="text-sm text-text-secondary">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <ul className="flex w-full flex-col gap-2" role="list">
      {exercises.map((exercise) => (
        <li key={exercise.id}>
          <ExerciseCard exercise={exercise} />
        </li>
      ))}
    </ul>
  )
}
