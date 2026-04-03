# GymBro

Mobile-first gym workout tracker — log exercises, sets, reps, and weight during workouts.

## Stack
Next.js 15 (App Router, TypeScript) + REST + Drizzle ORM + PostgreSQL + Auth.js v5 + Tailwind CSS

Standards:
- Universal: C:/Users/sepeh/Documents/workspace/toolbox/standards/universal/
- Next.js: C:/Users/sepeh/Documents/workspace/toolbox/standards/stacks/typescript-nextjs/
- React: C:/Users/sepeh/Documents/workspace/toolbox/standards/stacks/typescript-react/
- Drizzle + Postgres: C:/Users/sepeh/Documents/workspace/toolbox/standards/stacks/drizzle-postgres/

## Memory

Read these before starting any task:

- `C:/Users/sepeh/Documents/workspace/vault/02-projects/gymbro/memory/project_context.md` — project goals, stakeholders, constraints
- `C:/Users/sepeh/Documents/workspace/vault/02-projects/gymbro/memory/stack.md` — stack choice and rationale
- `C:/Users/sepeh/Documents/workspace/vault/02-projects/gymbro/memory/architecture.md` — structure and key components
- `C:/Users/sepeh/Documents/workspace/vault/02-projects/gymbro/memory/progress.md` — current phase, done, next
- `C:/Users/sepeh/Documents/workspace/vault/02-projects/gymbro/memory/lessons.md` — what's working, what isn't
- `C:/Users/sepeh/Documents/workspace/vault/02-projects/gymbro/memory/decisions/` — architectural decision records

## Standards

Apply on every task:
- Universal: C:/Users/sepeh/Documents/workspace/toolbox/standards/universal/
- Stack: C:/Users/sepeh/Documents/workspace/toolbox/standards/stacks/typescript-nextjs/

## Lifecycle Skills

- `/implement`       → C:/Users/sepeh/Documents/workspace/toolbox/skills/implement.md
- `/standards-check` → C:/Users/sepeh/Documents/workspace/toolbox/skills/standards-check.md
- `/retrospective`   → C:/Users/sepeh/Documents/workspace/toolbox/skills/retrospective.md
- `/index-repo`      → C:/Users/sepeh/Documents/workspace/toolbox/skills/index-repo.md

## Index (if initialized)

If `.claude/index/` exists, read at session start:
- `.claude/index/README.md` — repo map and cluster overview

Run `/index-repo` to build or refresh. Re-run after major refactors.

## Code Navigation

1. If `.claude/index/` exists — launch a sub-agent via `C:/Users/sepeh/Documents/workspace/toolbox/skills/query-index.md`
2. Fall back to Grep/Glob only if the index doesn't exist
3. Never re-read files the index already summarizes

## Before Writing Code (blocking)

- **Orchestrating via `/implement`**: read only `C:/Users/sepeh/Documents/workspace/toolbox/standards/universal/DIGEST.md`
- **Direct one-off edits**: invoke `C:/Users/sepeh/Documents/workspace/toolbox/skills/load-standards.md` and wait for the confirmation line.

## Always Apply

- Read project memory before starting any task
- Follow active stack standards throughout
- Write session summary to `C:/Users/sepeh/Documents/workspace/vault/02-projects/gymbro/memory/progress.md` when stopping
- Run `/standards-check` before opening any PR
- Weight is always stored in kg server-side; convert on display only
- All API routes must call `requireSession()` before any DB access
