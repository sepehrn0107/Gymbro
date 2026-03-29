import { getCurrentUserId } from "@/lib/auth-helpers"
import {
  getAllExerciseTypes,
  getAllEquipment,
  getAllMuscleGroups,
} from "@/services/lookup.service"
import { CreateExerciseForm } from "@/components/exercises/CreateExerciseForm"

export default async function NewExercisePage() {
  // Authenticate before fetching any data.
  await getCurrentUserId()

  // Fetch all lookup data in parallel — these are static tables.
  const [exerciseTypes, equipment, muscleGroups] = await Promise.all([
    getAllExerciseTypes(),
    getAllEquipment(),
    getAllMuscleGroups(),
  ])

  return (
    <div className="px-4 py-6">
      <header className="mb-6">
        <h1 className="font-heading text-3xl font-bold text-text-primary">
          Create Exercise
        </h1>
      </header>

      <CreateExerciseForm
        exerciseTypes={exerciseTypes}
        equipment={equipment}
        muscleGroups={muscleGroups}
      />
    </div>
  )
}
