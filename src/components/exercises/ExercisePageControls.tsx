"use client"

import { useRouter } from "next/navigation"
import type { MuscleGroup } from "@/types/domain"
import { ExerciseSearchBar } from "./ExerciseSearchBar"
import { MuscleGroupFilter } from "./MuscleGroupFilter"

interface CurrentParams {
  q?: string
  muscleGroupId?: string
  exerciseTypeId?: string
  equipmentId?: string
  page?: string
}

interface ExercisePageControlsProps {
  initialQ: string
  muscleGroupId: string | null
  muscleGroups: MuscleGroup[]
  baseUrl: string
  currentParams: CurrentParams
}

/**
 * Client wrapper that wires ExerciseSearchBar and MuscleGroupFilter to URL
 * updates via next/navigation router. Extracted so the parent page remains a
 * Server Component.
 */
export function ExercisePageControls({
  initialQ,
  muscleGroupId,
  muscleGroups,
  baseUrl,
  currentParams,
}: ExercisePageControlsProps) {
  const router = useRouter()

  function buildUrl(overrides: Record<string, string | undefined>): string {
    const merged: Record<string, string> = {}
    if (currentParams.q) merged.q = currentParams.q
    if (currentParams.muscleGroupId) merged.muscleGroupId = currentParams.muscleGroupId
    if (currentParams.exerciseTypeId) merged.exerciseTypeId = currentParams.exerciseTypeId
    if (currentParams.equipmentId) merged.equipmentId = currentParams.equipmentId
    // Reset to page 1 whenever filters change
    for (const [k, v] of Object.entries(overrides)) {
      if (v === undefined || v === "") {
        delete merged[k]
      } else {
        merged[k] = v
      }
    }
    const qs = new URLSearchParams(merged).toString()
    return qs ? `${baseUrl}?${qs}` : baseUrl
  }

  function handleSearch(q: string) {
    router.push(buildUrl({ q: q || undefined, page: undefined }))
  }

  function handleMuscleGroupChange(id: string | null) {
    router.push(buildUrl({ muscleGroupId: id ?? undefined, page: undefined }))
  }

  return (
    <>
      <ExerciseSearchBar value={initialQ} onSearch={handleSearch} />
      <MuscleGroupFilter
        muscleGroups={muscleGroups}
        value={muscleGroupId}
        onChange={handleMuscleGroupChange}
      />
    </>
  )
}
