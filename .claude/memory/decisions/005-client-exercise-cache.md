# ADR-005: Client-Side Full Exercise Cache

## Decision
Fetch the full exercise list once on app load and filter client-side. Cache invalidates after 5 minutes or on any mutation.

## Rationale
- Global library (~80) + user customs (< 30) is small enough to hold in memory
- Enables instant search with zero network latency
- Avoids server round-trips on every keystroke (critical for mobile performance)

## Status
Accepted — 2026-03-29
