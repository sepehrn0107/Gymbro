# Stack

## Choices

| Layer | Technology | Rationale |
|---|---|---|
| Framework | Next.js 15 (App Router, TypeScript) | Mobile-first PWA-capable, instant browser deploy, server components |
| API | REST (Next.js Route Handlers) | Clean resource hierarchy, independently testable, future native client ready |
| ORM | Drizzle ORM | TypeScript-native, no Rust binary, clean Docker builds, SQL-close query API |
| Database | PostgreSQL | Relational data model (users → workouts → exercises → sets) |
| Auth | Auth.js v5 (NextAuth) | Free/OSS, Next.js native, Google OAuth + Credentials, Drizzle adapter |
| UI | Tailwind CSS + Lucide React | Utility-first, mobile-first, consistent icon set |
| Fonts | Barlow Condensed (headings) + Barlow (body) | Athletic, condensed, energetic — perfect for fitness context |
| Charts | Recharts | React-native, tree-shakeable, adequate for line charts |
| Hosting | Cloud-agnostic via Docker | docker-compose local, Dockerfile for any cloud (Vercel, Railway, Render, Fly.io) |

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
