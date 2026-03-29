# Architecture

## Directory Structure

```
gymbro/
├── src/
│   ├── app/                          ← Next.js App Router
│   │   ├── (auth)/                   ← login, register (unauthenticated)
│   │   ├── (app)/                    ← authenticated shell with bottom nav
│   │   │   ├── dashboard/
│   │   │   ├── exercises/            ← library + new exercise
│   │   │   ├── workout/              ← active workout + history detail
│   │   │   ├── history/
│   │   │   └── progress/[exerciseId]/
│   │   └── api/                      ← REST Route Handlers
│   │       ├── auth/
│   │       ├── exercises/
│   │       ├── muscle-groups/
│   │       ├── exercise-types/
│   │       ├── equipment/
│   │       ├── workouts/
│   │       └── progress/
│   ├── db/
│   │   ├── index.ts                  ← Drizzle client singleton
│   │   ├── schema/                   ← users, exercises, workouts, relations
│   │   ├── migrations/               ← drizzle-kit generated
│   │   └── seed/                     ← ~80 global exercises + lookup data
│   ├── services/                     ← business logic (no HTTP)
│   │   ├── exercise.service.ts
│   │   ├── workout.service.ts
│   │   ├── set.service.ts
│   │   ├── progress.service.ts
│   │   └── user.service.ts
│   ├── lib/
│   │   ├── auth.ts                   ← Auth.js config
│   │   ├── auth-helpers.ts           ← requireSession(), getCurrentUserId()
│   │   ├── api-response.ts           ← ok() / err() helpers
│   │   ├── units.ts                  ← kgToLb, lbToKg, formatWeight
│   │   ├── errors.ts                 ← AppError hierarchy
│   │   └── validations/              ← Zod schemas per domain
│   ├── hooks/                        ← React client hooks
│   │   ├── useExercises.ts           ← client-side full-list cache
│   │   ├── useActiveWorkout.ts       ← optimistic mutations
│   │   ├── useLastSession.ts         ← pre-fill hints
│   │   └── useOfflineQueue.ts        ← in-memory mutation queue
│   ├── components/
│   │   ├── ui/                       ← Button, Input, Badge, Sheet, Skeleton, Toast
│   │   ├── layout/                   ← BottomNav, PageHeader, ResumeBanner
│   │   ├── exercises/
│   │   ├── workout/
│   │   ├── history/
│   │   └── progress/
│   └── types/
│       ├── api.ts                    ← request/response shapes
│       └── domain.ts                 ← WorkoutStatus, SetType, UnitPreference enums
├── docker-compose.yml
├── Dockerfile
└── drizzle.config.ts
```

## Key Layers

**Route Handler → Service → DB** (strict — no DB access in handlers, no HTTP in services)

**Data Model:**
- `users` — Auth.js managed + `unitPreference`, `displayName`
- `muscle_groups`, `exercise_types`, `equipment` — lookup tables, seeded
- `exercises` — global (`is_global=true`) or user-created custom
- `exercise_secondary_muscles` — junction table for many-to-many
- `workouts` — session with `status: in_progress|completed|discarded`
- `workout_exercises` — ordered bridge between workout and exercise
- `sets` — reps + weight (kg) + set_type per workout_exercise

## API Response Envelope
```ts
// Success: { data: T }
// Error:   { error: { message: string, code?: string } }
```

## Navigation (Bottom Nav, 4 items)
Dashboard | Exercises | Workout (active) | History
