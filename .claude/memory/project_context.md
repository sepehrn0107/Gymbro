# Project Context

## What

GymBro — a mobile-first gym workout tracker web app. Multi-user, cloud-hosted.

## Core Purpose

Let users log workouts (exercises + sets + reps + weight) in real time during a gym session, and review their progress over time.

## Users

- Multiple users with accounts
- Primary use: during workouts on a phone — must be thumb-friendly, fast, minimal taps

## MVP Features

1. Auth (Google OAuth)
   - Email verification (OTP-based) after registration
   - Forgot password / reset password via emailed code
   - Change password (authenticated)
2. Global exercise library (~80 exercises, seeded)
3. Custom exercise creation (user-scoped)
   - Activity type per exercise: bodyweight | weight | resistance | cardio
   - Hierarchical muscle group taxonomy (e.g. Upper Body → Arms → Biceps)
4. User profile with physical stats: age, body weight, height (in addition to unit preference)
5. Start / finish a workout session
   - Session-level notes (free text)
   - Session total duration (minutes)
6. Add exercises to active workout
   - Per-exercise notes within a session
7. Log sets with last-session pre-fill hint
   - Per-set fields: reps, weight, duration (cardio/timed), restTime (seconds), RPE 1–10
   - Bodyweight exercises: weight = null, reps-only
8. Workout history (list + detail)
9. Per-exercise progress chart (max weight over time)
10. kg/lb preference per user

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
