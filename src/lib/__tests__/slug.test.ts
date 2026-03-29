import { describe, expect, it } from "vitest"

import { generateCustomSlug, generateGlobalSlug } from "@/lib/slug"

describe("generateCustomSlug", () => {
  it("should produce a valid slug format with 4-hex-char suffix", () => {
    const slug = generateCustomSlug("Bench Press")
    // Full format: <slugified-name>-<4 hex chars>
    expect(slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*-[0-9a-f]{4}$/)
  })

  it("should lowercase the name", () => {
    const slug = generateCustomSlug("SQUAT")
    expect(slug.startsWith("squat-")).toBe(true)
  })

  it("should replace spaces with hyphens", () => {
    const slug = generateCustomSlug("bench press")
    expect(slug.startsWith("bench-press-")).toBe(true)
  })

  it("should replace special characters with hyphens", () => {
    const slug = generateCustomSlug("T-Bar Row (Cable)")
    // non-alphanumeric -> hyphens, consecutive collapsed
    expect(slug).toMatch(/^t-bar-row-cable-[0-9a-f]{4}$/)
  })

  it("should collapse consecutive hyphens into one", () => {
    const slug = generateCustomSlug("A  B   C")
    // multiple spaces -> multiple hyphens -> collapsed
    expect(slug).toMatch(/^a-b-c-[0-9a-f]{4}$/)
  })

  it("should trim leading and trailing hyphens from the base slug", () => {
    const slug = generateCustomSlug("  hello  ")
    expect(slug).toMatch(/^hello-[0-9a-f]{4}$/)
  })

  it("should append exactly 4 lowercase hex characters as suffix", () => {
    const slug = generateCustomSlug("test")
    const parts = slug.split("-")
    const suffix = parts[parts.length - 1]
    expect(suffix).toHaveLength(4)
    expect(suffix).toMatch(/^[0-9a-f]{4}$/)
  })

  it("should produce different suffixes on multiple calls (randomness)", () => {
    const slugs = new Set(Array.from({ length: 20 }, () => generateCustomSlug("deadlift")))
    // With 65k possibilities, 20 calls should almost certainly produce at least 2 unique values
    expect(slugs.size).toBeGreaterThan(1)
  })

  it("should handle names with numbers", () => {
    const slug = generateCustomSlug("21s Curl")
    expect(slug).toMatch(/^21s-curl-[0-9a-f]{4}$/)
  })

  it("should handle names that are only special characters gracefully", () => {
    const slug = generateCustomSlug("!!!")
    // After stripping non-alphanumeric, trimming, the base slug may be empty
    // The result should still end with -xxxx
    expect(slug).toMatch(/-[0-9a-f]{4}$/)
  })
})

describe("generateGlobalSlug", () => {
  it("should produce a valid slug without a random suffix", () => {
    const slug = generateGlobalSlug("Bench Press")
    expect(slug).toBe("bench-press")
  })

  it("should lowercase the name", () => {
    const slug = generateGlobalSlug("SQUAT")
    expect(slug).toBe("squat")
  })

  it("should replace spaces with hyphens", () => {
    const slug = generateGlobalSlug("Overhead Press")
    expect(slug).toBe("overhead-press")
  })

  it("should replace special characters with hyphens and collapse them", () => {
    const slug = generateGlobalSlug("T-Bar Row (Cable)")
    expect(slug).toBe("t-bar-row-cable")
  })

  it("should trim leading and trailing hyphens", () => {
    const slug = generateGlobalSlug("  hello  ")
    expect(slug).toBe("hello")
  })

  it("should be deterministic — same input always returns same output", () => {
    expect(generateGlobalSlug("Romanian Deadlift")).toBe(generateGlobalSlug("Romanian Deadlift"))
  })
})
