"use client"

import { useState, useEffect, useRef } from "react"

import type { ExerciseListItem } from "@/types/domain"
import type { ExerciseQueryInput } from "@/lib/validations/exercises"

interface UseExercisesResult {
  exercises: ExerciseListItem[]
  total: number
  page: number
  pageSize: number
  isLoading: boolean
  error: string | null
}

const DEBOUNCE_MS = 300

/**
 * Client-side hook for fetching exercises with optional query parameters.
 *
 * - Debounces the fetch when `q` changes (300ms).
 * - Returns paginated results and loading/error state.
 * - Uses useState + useEffect (no SWR dependency required).
 *
 * NOTE: Phase 1 pages use server rendering. This hook is not wired to any
 * page in Phase 1 but is complete and ready for Phase 2 live-search UX.
 */
export function useExercises(query: Partial<ExerciseQueryInput>): UseExercisesResult {
  const [exercises, setExercises] = useState<ExerciseListItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Keep a stable ref to the latest query to avoid stale closure issues.
  const queryRef = useRef(query)
  queryRef.current = query

  // Separate the q value so we can debounce it independently.
  const { q, ...restQuery } = query

  useEffect(() => {
    let cancelled = false

    function buildQueryString(overrideQ?: string): string {
      const params = new URLSearchParams()
      if (overrideQ) params.set("q", overrideQ)
      if (restQuery.muscleGroupId) params.set("muscleGroupId", restQuery.muscleGroupId)
      if (restQuery.exerciseTypeId) params.set("exerciseTypeId", restQuery.exerciseTypeId)
      if (restQuery.equipmentId) params.set("equipmentId", restQuery.equipmentId)
      if (restQuery.page) params.set("page", String(restQuery.page))
      if (restQuery.pageSize) params.set("pageSize", String(restQuery.pageSize))
      return params.toString()
    }

    async function fetchExercises(currentQ?: string) {
      if (cancelled) return

      setIsLoading(true)
      setError(null)

      try {
        const qs = buildQueryString(currentQ)
        const url = qs ? `/api/exercises?${qs}` : "/api/exercises"
        const res = await fetch(url)

        if (cancelled) return

        if (!res.ok) {
          const json = await res.json().catch(() => ({})) as { message?: string }
          setError(json.message ?? `Request failed with status ${res.status}`)
          return
        }

        const json = await res.json() as {
          data: {
            items: ExerciseListItem[]
            total: number
            page: number
            pageSize: number
          }
        }

        if (!cancelled) {
          setExercises(json.data.items)
          setTotal(json.data.total)
          setPage(json.data.page)
          setPageSize(json.data.pageSize)
        }
      } catch (err) {
        if (!cancelled) {
          setError("Network error. Please check your connection.")
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    // Debounce only the q param; fire immediately for other filter changes.
    if (q !== undefined && q !== "") {
      const timer = setTimeout(() => {
        fetchExercises(q)
      }, DEBOUNCE_MS)
      return () => {
        cancelled = true
        clearTimeout(timer)
      }
    } else {
      fetchExercises(q)
      return () => {
        cancelled = true
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    q,
    restQuery.muscleGroupId,
    restQuery.exerciseTypeId,
    restQuery.equipmentId,
    restQuery.page,
    restQuery.pageSize,
  ])

  return { exercises, total, page, pageSize, isLoading, error }
}
