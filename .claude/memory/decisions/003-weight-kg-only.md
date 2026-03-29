# ADR-003: Store All Weights in kg, Convert on Display

## Decision
All weight values are stored in kg in the database. The `lib/units.ts` `formatWeight(kg, pref)` function handles display conversion.

## Rationale
- Mixing storage units creates irreversible corruption when users switch preferences
- Single conversion point is fully unit-testable
- API contract is explicit: all weight values in request/response bodies are in kg

## Status
Accepted — 2026-03-29
