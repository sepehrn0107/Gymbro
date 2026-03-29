/**
 * Slug generation utilities.
 *
 * generateGlobalSlug — deterministic slug for seeded/admin exercises.
 * generateCustomSlug — same slug base with a 4-char random hex suffix to
 *   satisfy the global unique constraint on exercises.slug without requiring
 *   a composite key change.
 */

/**
 * Slugify a string: lowercase, replace non-alphanumeric chars with hyphens,
 * collapse consecutive hyphens, trim leading/trailing hyphens.
 */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
}

/**
 * Generate a URL-safe slug for seeded/admin (global) exercises.
 * No random suffix — fully deterministic.
 *
 * Example: "Bench Press" → "bench-press"
 */
export function generateGlobalSlug(name: string): string {
  return slugify(name)
}

/**
 * Generate a URL-safe slug for user-created (custom) exercises.
 * Appends a "-" followed by 4 random lowercase hex characters to make
 * the slug globally unique without a composite key.
 *
 * Example: "Bench Press" → "bench-press-a3f9"
 */
export function generateCustomSlug(name: string): string {
  const base = slugify(name)
  const suffix = Math.floor(Math.random() * 0x10000)
    .toString(16)
    .padStart(4, "0")
  return `${base}-${suffix}`
}
