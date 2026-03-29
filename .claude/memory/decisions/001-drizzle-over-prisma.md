# ADR-001: Drizzle ORM over Prisma

## Decision
Use Drizzle ORM instead of Prisma.

## Rationale
- Schema is plain TypeScript — no code generation step
- No Rust binary dependency (cleaner Docker builds)
- Query API stays close to SQL — complex progress aggregations (max weight per session) are straightforward
- Prisma's DX is better for simple CRUD but the binary and client generation adds friction in Docker

## Status
Accepted — 2026-03-29
