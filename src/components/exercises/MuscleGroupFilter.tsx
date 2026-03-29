"use client"

import type { MuscleGroup } from "@/types/domain"

interface MuscleGroupFilterProps {
  muscleGroups: MuscleGroup[]
  value: string | null
  onChange: (id: string | null) => void
}

export function MuscleGroupFilter({
  muscleGroups,
  value,
  onChange,
}: MuscleGroupFilterProps) {
  // Partition into top-level groups (parentId=null) and leaf nodes (parentId set).
  // Top-level groups become <optgroup> labels; leaves become <option> elements under them.
  // Any leaf whose parent is not in the list falls back to a flat ungrouped option.
  const topLevel = muscleGroups.filter((mg) => mg.parentId === null)
  const topLevelIds = new Set(topLevel.map((mg) => mg.id))
  const leaves = muscleGroups.filter((mg) => mg.parentId !== null)

  // Group leaves by parentId
  const childrenByParent = new Map<string, MuscleGroup[]>()
  for (const leaf of leaves) {
    const parentId = leaf.parentId as string
    if (!childrenByParent.has(parentId)) {
      childrenByParent.set(parentId, [])
    }
    childrenByParent.get(parentId)!.push(leaf)
  }

  // Leaves whose parent is not in the list — render ungrouped at the bottom
  const orphanLeaves = leaves.filter((mg) => !topLevelIds.has(mg.parentId as string))

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value
    onChange(val === "" ? null : val)
  }

  return (
    <select
      value={value ?? ""}
      onChange={handleChange}
      className="w-full rounded-xl bg-surface-raised px-4 py-3 font-label text-xs font-bold uppercase tracking-widest text-text-primary focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all"
      aria-label="Filter by muscle group"
    >
      <option value="">All muscle groups</option>

      {topLevel.map((parent) => {
        const children = childrenByParent.get(parent.id) ?? []
        if (children.length === 0) {
          // Top-level group with no children — render as a plain option
          return (
            <option key={parent.id} value={parent.id}>
              {parent.name}
            </option>
          )
        }
        return (
          <optgroup key={parent.id} label={parent.name}>
            {children.map((child) => (
              <option key={child.id} value={child.id}>
                {child.name}
              </option>
            ))}
          </optgroup>
        )
      })}

      {orphanLeaves.map((leaf) => (
        <option key={leaf.id} value={leaf.id}>
          {leaf.name}
        </option>
      ))}
    </select>
  )
}
