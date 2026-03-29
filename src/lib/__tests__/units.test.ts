import { describe, expect, it } from "vitest"

import { formatWeight, kgToLb, lbToKg } from "@/lib/units"

describe("kgToLb", () => {
  it("should convert 0 kg to 0 lb", () => {
    expect(kgToLb(0)).toBe(0)
  })

  it("should convert 1 kg to 2.2 lb (1 decimal)", () => {
    expect(kgToLb(1)).toBe(2.2)
  })

  it("should convert 45 kg to 99.2 lb", () => {
    expect(kgToLb(45)).toBe(99.2)
  })

  it("should round to 1 decimal place", () => {
    expect(kgToLb(100)).toBe(220.5)
  })

  it("should handle decimal kg input", () => {
    expect(kgToLb(2.5)).toBe(5.5)
  })
})

describe("lbToKg", () => {
  it("should convert 0 lb to 0 kg", () => {
    expect(lbToKg(0)).toBe(0)
  })

  it("should convert 100 lb to roughly 45.359 kg", () => {
    expect(lbToKg(100)).toBe(45.359)
  })

  it("should convert 2.20462 lb to 1 kg", () => {
    expect(lbToKg(2.20462)).toBe(1)
  })

  it("should round to 3 decimal places", () => {
    const result = lbToKg(10)
    expect(result).toBe(4.536)
  })
})

describe("formatWeight", () => {
  it("should return 'BW' when weight is null", () => {
    expect(formatWeight(null, "metric")).toBe("BW")
    expect(formatWeight(null, "imperial")).toBe("BW")
  })

  it("should format metric weight with 'kg' suffix", () => {
    expect(formatWeight(45, "metric")).toBe("45 kg")
    expect(formatWeight(100, "metric")).toBe("100 kg")
    expect(formatWeight(22.5, "metric")).toBe("22.5 kg")
  })

  it("should format imperial weight with 'lb' suffix after converting from kg", () => {
    expect(formatWeight(45, "imperial")).toBe("99.2 lb")
    expect(formatWeight(100, "imperial")).toBe("220.5 lb")
  })

  it("should handle 0 kg in metric", () => {
    expect(formatWeight(0, "metric")).toBe("0 kg")
  })

  it("should handle 0 kg in imperial", () => {
    expect(formatWeight(0, "imperial")).toBe("0 lb")
  })
})
