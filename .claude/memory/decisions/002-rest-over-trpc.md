# ADR-002: REST Route Handlers over tRPC

## Decision
Use REST (Next.js Route Handlers) instead of tRPC.

## Rationale
- Data model has a clear resource hierarchy (workout → exercise → set) that maps cleanly to REST
- API is independently testable via curl/Postman without a client adapter
- Opens the door to a native mobile client later without rewriting the API layer
- tRPC couples client to server internals

## Status
Accepted — 2026-03-29
