# Ticket Context

## Ticket
Bootstrap the GymBro project from scratch: scaffold a Next.js 15 app with App Router and TypeScript, configure Drizzle ORM with a Docker-based PostgreSQL database, set up Auth.js v5 with email/password credentials and Google OAuth (including email OTP verification, forgot/reset password flows, and change password), write the full database schema with migrations (hierarchical muscle_groups, rich set fields, workout notes, user profile fields), and seed ~80 global exercises with lookup data.

## Stack
Next.js 15 (App Router, TypeScript) + Drizzle ORM + PostgreSQL + Auth.js v5 + Tailwind CSS + Lucide React

## Index available
false

## Project summary
- project_context: GymBro — mobile-first gym workout tracker with auth, exercise library, session logging, history, and progress charts
- stack: Next.js 15 + Drizzle + PostgreSQL + Auth.js v5 + Tailwind; dark OLED design system; weight always stored in kg
- architecture: Route Handler → Service → DB layering; App Router with (auth)/(app) route groups; bottom nav with 4 tabs
- progress: Planning complete — all 4 implementation phases defined; Phase 0 (scaffold/infra) is next
