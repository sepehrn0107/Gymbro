# ADR-004: Auth.js v5 (NextAuth) for Authentication

## Decision
Use Auth.js v5 (NextAuth) instead of Auth0.

## Rationale
- Free and open-source — no vendor cost
- Native App Router support in v5
- Drizzle adapter avoids a second ORM
- Credentials provider handles email/password with bcrypt
- Google OAuth for social sign-in
- Session strategy: `database` (not JWT) — enables server-side revocation

## Status
Accepted — 2026-03-29 (replaced Auth0 after user preference)
