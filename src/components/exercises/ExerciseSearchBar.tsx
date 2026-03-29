"use client"

import { useEffect, useRef, useState } from "react"

interface ExerciseSearchBarProps {
  value: string
  onSearch: (q: string) => void
  placeholder?: string
}

const DEBOUNCE_MS = 300

export function ExerciseSearchBar({
  value,
  onSearch,
  placeholder = "Search exercises…",
}: ExerciseSearchBarProps) {
  // Local state tracks the raw input value so typing is responsive.
  // The debounced onSearch fires after the user stops typing.
  const [inputValue, setInputValue] = useState(value)

  // Sync if the parent changes the controlled value (e.g. URL param reset)
  useEffect(() => {
    setInputValue(value)
  }, [value])

  // Keep a stable ref to onSearch to avoid adding it to the effect dep array
  const onSearchRef = useRef(onSearch)
  useEffect(() => {
    onSearchRef.current = onSearch
  })

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchRef.current(inputValue)
    }, DEBOUNCE_MS)

    return () => clearTimeout(timer)
  }, [inputValue])

  return (
    <input
      type="search"
      value={inputValue}
      onChange={(e) => setInputValue(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-lg bg-surface-raised px-4 py-2.5 text-sm text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
      aria-label={placeholder}
    />
  )
}
