import type { UnitPreference } from "@/types/domain"

const KG_TO_LB = 2.20462

/**
 * Convert kilograms to pounds, rounded to 1 decimal place.
 */
export function kgToLb(kg: number): number {
  return Math.round(kg * KG_TO_LB * 10) / 10
}

/**
 * Convert pounds to kilograms, rounded to 3 decimal places.
 */
export function lbToKg(lb: number): number {
  return Math.round((lb / KG_TO_LB) * 1000) / 1000
}

/**
 * Format a weight value for display.
 *
 * - Returns "BW" for bodyweight exercises (null weight).
 * - Returns "45 kg" for metric.
 * - Returns "99.2 lb" for imperial (converts from stored kg).
 *
 * @param kg   - Weight in kilograms (server-side storage unit), or null for bodyweight.
 * @param unit - The user's display preference.
 */
export function formatWeight(kg: number | null, unit: UnitPreference): string {
  if (kg === null) return "BW"

  if (unit === "metric") {
    return `${kg} kg`
  }

  return `${kgToLb(kg)} lb`
}
