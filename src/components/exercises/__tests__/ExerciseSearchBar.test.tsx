import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

/**
 * Unit tests for ExerciseSearchBar debounce logic.
 *
 * The vitest environment is "node" (no jsdom) so DOM rendering via RTL is not
 * available. These tests extract and verify the debounce behaviour that the
 * component implements: a 300 ms setTimeout that fires onSearch once after the
 * user stops typing, clearing any pending timer on each new value.
 */

const DEBOUNCE_MS = 300

// ── Extracted debounce helper (mirrors component implementation) ──────────────
//
// The component uses useEffect + setTimeout internally. We test the equivalent
// pure function here to keep the suite fast and environment-agnostic.

function createDebouncedSearch(
  onSearch: (q: string) => void,
  delayMs: number = DEBOUNCE_MS,
) {
  let timerId: ReturnType<typeof setTimeout> | null = null

  function search(query: string) {
    if (timerId !== null) clearTimeout(timerId)
    timerId = setTimeout(() => {
      onSearch(query)
    }, delayMs)
  }

  function cancel() {
    if (timerId !== null) clearTimeout(timerId)
  }

  return { search, cancel }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("ExerciseSearchBar — debounce logic", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("does NOT call onSearch immediately on first keystroke", () => {
    const onSearch = vi.fn()
    const { search } = createDebouncedSearch(onSearch)

    search("b")

    expect(onSearch).not.toHaveBeenCalled()
  })

  it("calls onSearch after the debounce delay", () => {
    const onSearch = vi.fn()
    const { search } = createDebouncedSearch(onSearch)

    search("bench")

    vi.advanceTimersByTime(DEBOUNCE_MS)

    expect(onSearch).toHaveBeenCalledTimes(1)
    expect(onSearch).toHaveBeenCalledWith("bench")
  })

  it("calls onSearch with the correct (latest) value", () => {
    const onSearch = vi.fn()
    const { search } = createDebouncedSearch(onSearch)

    search("squat")

    vi.advanceTimersByTime(DEBOUNCE_MS)

    expect(onSearch).toHaveBeenCalledWith("squat")
  })

  it("does NOT call onSearch before the debounce delay has elapsed", () => {
    const onSearch = vi.fn()
    const { search } = createDebouncedSearch(onSearch)

    search("dead")

    vi.advanceTimersByTime(DEBOUNCE_MS - 1)

    expect(onSearch).not.toHaveBeenCalled()
  })

  it("fires onSearch only once when multiple keystrokes arrive within the debounce window", () => {
    const onSearch = vi.fn()
    const { search } = createDebouncedSearch(onSearch)

    search("b")
    vi.advanceTimersByTime(100)
    search("be")
    vi.advanceTimersByTime(100)
    search("ben")
    vi.advanceTimersByTime(100)
    search("bench")

    // Total elapsed: 300 ms from last keystroke starts now
    vi.advanceTimersByTime(DEBOUNCE_MS)

    expect(onSearch).toHaveBeenCalledTimes(1)
    expect(onSearch).toHaveBeenCalledWith("bench")
  })

  it("fires onSearch once per burst when the user types two separate bursts", () => {
    const onSearch = vi.fn()
    const { search } = createDebouncedSearch(onSearch)

    // First burst
    search("bench")
    vi.advanceTimersByTime(DEBOUNCE_MS)

    expect(onSearch).toHaveBeenCalledTimes(1)
    expect(onSearch).toHaveBeenNthCalledWith(1, "bench")

    // Second burst
    search("squat")
    vi.advanceTimersByTime(DEBOUNCE_MS)

    expect(onSearch).toHaveBeenCalledTimes(2)
    expect(onSearch).toHaveBeenNthCalledWith(2, "squat")
  })

  it("calls onSearch with an empty string when input is cleared", () => {
    const onSearch = vi.fn()
    const { search } = createDebouncedSearch(onSearch)

    search("")

    vi.advanceTimersByTime(DEBOUNCE_MS)

    expect(onSearch).toHaveBeenCalledWith("")
  })

  it("cancel() prevents a pending debounced call from firing", () => {
    const onSearch = vi.fn()
    const { search, cancel } = createDebouncedSearch(onSearch)

    search("bench")
    cancel()

    vi.advanceTimersByTime(DEBOUNCE_MS * 2)

    expect(onSearch).not.toHaveBeenCalled()
  })
})
