import { describe, it, expect } from "vitest"

/**
 * Unit tests for the BottomNav active-route detection logic.
 * The component uses: pathname === href || pathname.startsWith(href + "/")
 * These tests verify that logic in isolation.
 */

function isNavItemActive(href: string, pathname: string): boolean {
  return pathname === href || pathname.startsWith(href + "/")
}

const NAV_HREFS = ["/dashboard", "/exercises", "/workout", "/history"] as const

describe("BottomNav — active route detection", () => {
  it("marks /dashboard active when pathname is exactly /dashboard", () => {
    expect(isNavItemActive("/dashboard", "/dashboard")).toBe(true)
  })

  it("marks /dashboard active for nested paths like /dashboard/stats", () => {
    expect(isNavItemActive("/dashboard", "/dashboard/stats")).toBe(true)
  })

  it("does not mark /dashboard active for /dashboardextra (no trailing slash match)", () => {
    expect(isNavItemActive("/dashboard", "/dashboardextra")).toBe(false)
  })

  it("marks /exercises active when on /exercises", () => {
    expect(isNavItemActive("/exercises", "/exercises")).toBe(true)
  })

  it("marks /exercises active for nested path /exercises/bench-press", () => {
    expect(isNavItemActive("/exercises", "/exercises/bench-press")).toBe(true)
  })

  it("marks /workout active for /workout", () => {
    expect(isNavItemActive("/workout", "/workout")).toBe(true)
  })

  it("marks /history active for /history", () => {
    expect(isNavItemActive("/history", "/history")).toBe(true)
  })

  it("marks /history active for nested path /history/2024-03-01", () => {
    expect(isNavItemActive("/history", "/history/2024-03-01")).toBe(true)
  })

  it("does not mark /exercises active when on /dashboard", () => {
    expect(isNavItemActive("/exercises", "/dashboard")).toBe(false)
  })

  it("does not mark /workout active when on /history", () => {
    expect(isNavItemActive("/workout", "/history")).toBe(false)
  })

  it("only one nav item is active at a time for /exercises", () => {
    const pathname = "/exercises"
    const activeItems = NAV_HREFS.filter((href) => isNavItemActive(href, pathname))
    expect(activeItems).toHaveLength(1)
    expect(activeItems[0]).toBe("/exercises")
  })

  it("only one nav item is active for /workout/active", () => {
    const pathname = "/workout/active"
    const activeItems = NAV_HREFS.filter((href) => isNavItemActive(href, pathname))
    expect(activeItems).toHaveLength(1)
    expect(activeItems[0]).toBe("/workout")
  })

  it("no items are active on auth routes like /login", () => {
    const pathname = "/login"
    const activeItems = NAV_HREFS.filter((href) => isNavItemActive(href, pathname))
    expect(activeItems).toHaveLength(0)
  })
})
