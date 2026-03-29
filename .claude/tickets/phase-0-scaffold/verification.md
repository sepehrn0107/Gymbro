# Verification Report

_Phase 0 Scaffold — verified 2026-03-29_

---

## Checklist

- [x] All key files present
- [x] Key invariants satisfied
- [x] Security checks passed
- [x] No regressions

---

## Issues found

None.

### Spot-check results

| Invariant | File | Result |
|---|---|---|
| `emailVerified` is `timestamp` (NOT `timestamptz`) | `src/db/schema/auth.ts:19` | PASS — `timestamp('emailVerified', { mode: 'date' })`, explicit comment "NOT timestamptz" |
| `weight` column is `numeric(8,3)` | `src/db/schema/workouts.ts:60` | PASS — `numeric('weight', { precision: 8, scale: 3 })` |
| `err()` handles both `AppError` and unknown | `src/lib/api-response.ts` | PASS — branches for `ValidationError`, `AppError`, and catch-all unknown with 500 + no leak |
| All auth route handlers wrap body in try/catch and return `err()` on failure | all `src/app/api/auth/*/route.ts` | PASS — all 5 routes (register, verify-email, forgot-password, reset-password, change-password) have `try { … } catch (error) { return err(error) }` |
| `middleware.ts` protects `/app/*`, excludes `/api/auth/*` | `middleware.ts` | PASS — matcher is `["/app/:path*"]`; `/api/auth/*` is not matched so Auth.js callbacks are never blocked |
| `.env.example` contains `AUTH_SECRET`, `DATABASE_URL`, `GOOGLE_CLIENT_ID` | `.env.example` | PASS — all three present with placeholder values and comments |
| No hardcoded secrets | full `src/` tree | PASS — grep for secrets pattern found no matches |
| `forgot-password` returns same message regardless of email existence | `src/app/api/auth/forgot-password/route.ts` | PASS — `GENERIC_MESSAGE` constant returned in both the "user not found" and "email sent" branches |
| Passwords hashed with bcrypt (not stored plain) | `register/route.ts`, `reset-password/route.ts`, `change-password/route.ts` | PASS — all three use `bcrypt.hash(…, 12)`; `auth.ts` also uses bcrypt for credential verification |

---

## Missing files

None — all 40 files in the expected list are present.

---

## Verdict

PASS
