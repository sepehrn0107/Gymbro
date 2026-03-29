# Stack

## Choices

| Layer | Technology | Version | Rationale |
|---|---|---|---|
| Framework | Next.js (App Router, TypeScript) | 15.x | Mobile-first PWA-capable, instant browser deploy, server components |
| Runtime | React | 19.x | Latest concurrent features |
| API | REST (Next.js Route Handlers) | — | Clean resource hierarchy, independently testable, future native client ready |
| ORM | Drizzle ORM | ^0.40 | TypeScript-native, no Rust binary, clean Docker builds, SQL-close query API |
| DB migrations | drizzle-kit | ^0.30 | Schema generation, push, and studio |
| Database | PostgreSQL (via `pg`) | ^8 | Relational data model (users → workouts → exercises → sets) |
| Auth | Auth.js v5 (next-auth) + @auth/drizzle-adapter | ^5.0.0-beta.25 | Free/OSS, Next.js native, Google OAuth + Credentials, Drizzle adapter |
| Password hashing | bcryptjs | ^2 | Credentials auth password hashing |
| Email | nodemailer | ^7 | Magic-link / verification emails |
| Validation | Zod | ^3 | API input validation, runtime type safety |
| UI | Tailwind CSS | ^3 | Utility-first, mobile-first |
| Icons | Lucide React | ^0.400 | Consistent icon set |
| Formatting | Prettier + prettier-plugin-tailwindcss | ^3 / ^0.6 | Class order enforcement |
| Charts | Recharts | not yet installed | React-native, tree-shakeable, adequate for line charts (planned) |
| Testing (unit) | Vitest + @vitest/coverage-v8 | ^4.1 | Fast TS-native unit tests |
| Testing (e2e) | Playwright | ^1.58 | Browser-level end-to-end tests |
| Hosting | Cloud-agnostic via Docker | — | docker-compose local, Dockerfile for any cloud (Vercel, Railway, Render, Fly.io) |

## Design System
- Style: Dark Mode OLED
- Background: #0A0A0A — Surface: #111111 / #1C1C1C
- Primary: #2563EB — Accent/CTA: #F97316
- Text primary: #F8FAFC — Text secondary: #94A3B8

## Standards Paths
- Universal: C:/Users/sepeh/Documents/workspace/toolbox/standards/universal/
- Next.js: C:/Users/sepeh/Documents/workspace/toolbox/standards/stacks/typescript-nextjs/
- Drizzle+Postgres: C:/Users/sepeh/Documents/workspace/toolbox/standards/stacks/drizzle-postgres/

## Key Conventions
- Weight stored in kg always server-side; `lib/units.ts` handles display conversion
- Session strategy: `database` (not JWT) — server-side session revocation
- All API route handlers: `requireSession()` → validate input (Zod) → call service → return response
- Optimistic updates for set logging (highest-frequency interaction)
