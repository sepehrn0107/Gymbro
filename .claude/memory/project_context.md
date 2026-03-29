# Project Context

## What
Repd — a mobile-first gym workout tracker web app. Multi-user, cloud-hosted.

## Core Purpose
Let users log workouts (exercises + sets + reps + weight) in real time during a gym session, and review their progress over time.

## Users
- Multiple users with accounts
- Primary use: during workouts on a phone — must be thumb-friendly, fast, minimal taps

## MVP Features
1. Auth (Google OAuth + email/password via Auth.js v5)
2. Global exercise library (~80 exercises, seeded)
3. Custom exercise creation (user-scoped)
4. Start / finish a workout session
5. Add exercises to active workout
6. Log sets (reps + weight) with last-session pre-fill hint
7. Workout history (list + detail)
8. Per-exercise progress chart (max weight over time)
9. kg/lb preference per user

## Key Constraints
- Mobile-first — every interaction must work well on a 375px screen
- Cloud-agnostic — Docker-based deployment, no platform lock-in
- Weight stored in kg always; convert on display only
- No Auth0 — Auth.js v5 (free, open-source)
- Use ASAP — not publishing to app stores, runs in browser

## Success Criteria
- Can log a full workout (start → add exercises → log sets → finish) in < 2 minutes
- Progress chart is visible after 2+ sessions with an exercise
- Works offline in degraded mode (sets queued in memory, flushed on reconnect)
