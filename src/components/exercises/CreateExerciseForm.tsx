"use client"

import { useRouter } from "next/navigation"
import { useTransition, useState, useMemo } from "react"

import type { ExerciseType, EquipmentItem, MuscleGroup } from "@/types/domain"

interface CreateExerciseFormProps {
  exerciseTypes: ExerciseType[]
  equipment: EquipmentItem[]
  muscleGroups: MuscleGroup[]
}

interface FieldErrors {
  name?: string[]
  exerciseTypeId?: string[]
  equipmentId?: string[]
  primaryMuscleGroupId?: string[]
  secondaryMuscleGroupIds?: string[]
  instructions?: string[]
  _form?: string[]
}

const MAX_INSTRUCTIONS = 2000
const MAX_SECONDARY = 10

export function CreateExerciseForm({
  exerciseTypes,
  equipment,
  muscleGroups,
}: CreateExerciseFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Form field state
  const [name, setName] = useState("")
  const [exerciseTypeId, setExerciseTypeId] = useState("")
  const [equipmentId, setEquipmentId] = useState("")
  const [level1Id, setLevel1Id] = useState("")
  const [level2Id, setLevel2Id] = useState("")
  const [level3Id, setLevel3Id] = useState("")
  const [secondaryIds, setSecondaryIds] = useState<string[]>([])
  const [instructions, setInstructions] = useState("")
  const [errors, setErrors] = useState<FieldErrors>({})

  // ── Hierarchical muscle group cascading selects ──────────────────────────────

  const topLevelGroups = useMemo(
    () => muscleGroups.filter((mg) => mg.parentId === null),
    [muscleGroups],
  )

  const level2Groups = useMemo(
    () => (level1Id ? muscleGroups.filter((mg) => mg.parentId === level1Id) : []),
    [muscleGroups, level1Id],
  )

  const level3Groups = useMemo(
    () => (level2Id ? muscleGroups.filter((mg) => mg.parentId === level2Id) : []),
    [muscleGroups, level2Id],
  )

  // The deepest selected level is the actual primaryMuscleGroupId.
  const primaryMuscleGroupId = level3Id || level2Id || level1Id || null

  function handleLevel1Change(id: string) {
    setLevel1Id(id)
    setLevel2Id("")
    setLevel3Id("")
  }

  function handleLevel2Change(id: string) {
    setLevel2Id(id)
    setLevel3Id("")
  }

  // ── Secondary muscle group toggles ──────────────────────────────────────────

  function toggleSecondary(id: string) {
    setSecondaryIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((x) => x !== id)
      }
      if (prev.length >= MAX_SECONDARY) {
        // Silently ignore — error is shown via validation
        return prev
      }
      return [...prev, id]
    })
    // Clear the secondary error when the user interacts
    setErrors((prev) => ({ ...prev, secondaryMuscleGroupIds: undefined }))
  }

  // ── Submit ───────────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErrors({})

    // Client-side secondary limit check
    if (secondaryIds.length > MAX_SECONDARY) {
      setErrors({ secondaryMuscleGroupIds: [`Maximum ${MAX_SECONDARY} secondary muscles allowed`] })
      return
    }

    const body = {
      name,
      exerciseTypeId,
      equipmentId: equipmentId || null,
      primaryMuscleGroupId: primaryMuscleGroupId || null,
      secondaryMuscleGroupIds: secondaryIds,
      instructions: instructions || undefined,
    }

    startTransition(async () => {
      try {
        const res = await fetch("/api/exercises", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })

        if (res.status === 201) {
          const json = await res.json() as { data: { slug: string } }
          router.push(`/exercises/${json.data.slug}`)
          return
        }

        const json = await res.json() as {
          error?: string
          errors?: Record<string, string[]>
          message?: string
        }

        if (res.status === 422 && json.errors) {
          setErrors(json.errors as FieldErrors)
          return
        }

        // Generic server error
        setErrors({ _form: [json.message ?? json.error ?? "Something went wrong. Please try again."] })
      } catch {
        setErrors({ _form: ["Network error. Please check your connection and try again."] })
      }
    })
  }

  const instructionsRemaining = MAX_INSTRUCTIONS - instructions.length

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      {/* Form-level error */}
      {errors._form && (
        <div
          role="alert"
          className="rounded-lg bg-red-900/30 px-4 py-3 text-sm text-red-400"
        >
          {errors._form.join(". ")}
        </div>
      )}

      {/* ── Name ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="exercise-name"
          className="text-sm font-semibold text-text-primary"
        >
          Exercise Name <span aria-hidden="true" className="text-accent">*</span>
        </label>
        <input
          id="exercise-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={100}
          placeholder="e.g. Incline Dumbbell Press"
          className="min-h-[48px] w-full rounded-lg bg-surface-raised px-4 py-3 text-sm text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
          aria-describedby={errors.name ? "name-error" : undefined}
        />
        {errors.name && (
          <p id="name-error" role="alert" className="text-xs text-red-400">
            {errors.name.join(". ")}
          </p>
        )}
      </div>

      {/* ── Exercise Type ─────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="exercise-type"
          className="text-sm font-semibold text-text-primary"
        >
          Exercise Type <span aria-hidden="true" className="text-accent">*</span>
        </label>
        <select
          id="exercise-type"
          value={exerciseTypeId}
          onChange={(e) => setExerciseTypeId(e.target.value)}
          required
          className="min-h-[48px] w-full rounded-lg bg-surface-raised px-4 py-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
          aria-describedby={errors.exerciseTypeId ? "type-error" : undefined}
        >
          <option value="">Select type…</option>
          {exerciseTypes.map((et) => (
            <option key={et.id} value={et.id}>
              {et.name}
            </option>
          ))}
        </select>
        {errors.exerciseTypeId && (
          <p id="type-error" role="alert" className="text-xs text-red-400">
            {errors.exerciseTypeId.join(". ")}
          </p>
        )}
      </div>

      {/* ── Equipment ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="exercise-equipment"
          className="text-sm font-semibold text-text-primary"
        >
          Equipment
        </label>
        <select
          id="exercise-equipment"
          value={equipmentId}
          onChange={(e) => setEquipmentId(e.target.value)}
          className="min-h-[48px] w-full rounded-lg bg-surface-raised px-4 py-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
          aria-describedby={errors.equipmentId ? "equipment-error" : undefined}
        >
          <option value="">None</option>
          {equipment.map((eq) => (
            <option key={eq.id} value={eq.id}>
              {eq.name}
            </option>
          ))}
        </select>
        {errors.equipmentId && (
          <p id="equipment-error" role="alert" className="text-xs text-red-400">
            {errors.equipmentId.join(". ")}
          </p>
        )}
      </div>

      {/* ── Primary Muscle Group — cascading selects ──────────────────────── */}
      <div className="flex flex-col gap-3">
        <span className="text-sm font-semibold text-text-primary">
          Primary Muscle Group
        </span>

        {/* Level 1 */}
        <div className="flex flex-col gap-1">
          <label htmlFor="muscle-level1" className="text-xs text-text-secondary">
            Category
          </label>
          <select
            id="muscle-level1"
            value={level1Id}
            onChange={(e) => handleLevel1Change(e.target.value)}
            className="min-h-[44px] w-full rounded-lg bg-surface-raised px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Select category…</option>
            {topLevelGroups.map((mg) => (
              <option key={mg.id} value={mg.id}>
                {mg.name}
              </option>
            ))}
          </select>
        </div>

        {/* Level 2 — only when level-1 has children */}
        {level1Id && level2Groups.length > 0 && (
          <div className="flex flex-col gap-1">
            <label htmlFor="muscle-level2" className="text-xs text-text-secondary">
              Muscle group
            </label>
            <select
              id="muscle-level2"
              value={level2Id}
              onChange={(e) => handleLevel2Change(e.target.value)}
              className="min-h-[44px] w-full rounded-lg bg-surface-raised px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Select group…</option>
              {level2Groups.map((mg) => (
                <option key={mg.id} value={mg.id}>
                  {mg.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Level 3 — only when level-2 has children */}
        {level2Id && level3Groups.length > 0 && (
          <div className="flex flex-col gap-1">
            <label htmlFor="muscle-level3" className="text-xs text-text-secondary">
              Specific muscle
            </label>
            <select
              id="muscle-level3"
              value={level3Id}
              onChange={(e) => setLevel3Id(e.target.value)}
              className="min-h-[44px] w-full rounded-lg bg-surface-raised px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Select specific…</option>
              {level3Groups.map((mg) => (
                <option key={mg.id} value={mg.id}>
                  {mg.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {errors.primaryMuscleGroupId && (
          <p role="alert" className="text-xs text-red-400">
            {errors.primaryMuscleGroupId.join(". ")}
          </p>
        )}
      </div>

      {/* ── Secondary Muscle Groups ────────────────────────────────────────── */}
      <div className="flex flex-col gap-2">
        <span className="text-sm font-semibold text-text-primary">
          Secondary Muscle Groups{" "}
          <span className="font-normal text-text-secondary">(max {MAX_SECONDARY})</span>
        </span>

        {secondaryIds.length >= MAX_SECONDARY && (
          <p role="alert" className="text-xs text-amber-400">
            Maximum {MAX_SECONDARY} secondary muscle groups selected.
          </p>
        )}

        {errors.secondaryMuscleGroupIds && (
          <p role="alert" className="text-xs text-red-400">
            {errors.secondaryMuscleGroupIds.join(". ")}
          </p>
        )}

        <div className="flex flex-col gap-2 rounded-lg bg-surface-raised p-3">
          {muscleGroups.map((mg) => {
            const checked = secondaryIds.includes(mg.id)
            const disabled = !checked && secondaryIds.length >= MAX_SECONDARY
            return (
              <label
                key={mg.id}
                className={`flex cursor-pointer items-center gap-3 py-1 ${disabled ? "opacity-40" : ""}`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleSecondary(mg.id)}
                  disabled={disabled}
                  className="h-4 w-4 rounded border-border accent-primary"
                  aria-label={mg.name}
                />
                <span className="text-sm text-text-primary">{mg.name}</span>
              </label>
            )
          })}
        </div>
      </div>

      {/* ── Instructions ──────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between">
          <label
            htmlFor="exercise-instructions"
            className="text-sm font-semibold text-text-primary"
          >
            Instructions
          </label>
          <span
            className={`text-xs ${instructionsRemaining < 100 ? "text-amber-400" : "text-text-secondary"}`}
          >
            {instructionsRemaining} remaining
          </span>
        </div>
        <textarea
          id="exercise-instructions"
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          maxLength={MAX_INSTRUCTIONS}
          rows={5}
          placeholder="Describe how to perform this exercise…"
          className="w-full rounded-lg bg-surface-raised px-4 py-3 text-sm text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
          aria-describedby={errors.instructions ? "instructions-error" : undefined}
        />
        {errors.instructions && (
          <p id="instructions-error" role="alert" className="text-xs text-red-400">
            {errors.instructions.join(". ")}
          </p>
        )}
      </div>

      {/* ── Submit ────────────────────────────────────────────────────────── */}
      <button
        type="submit"
        disabled={isPending}
        className="flex min-h-[56px] w-full items-center justify-center rounded-xl bg-primary px-6 py-4 font-heading text-lg font-semibold text-primary-foreground shadow transition-opacity active:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "Creating…" : "Create Exercise"}
      </button>
    </form>
  )
}
