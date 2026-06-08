# studio1 — Session Status (2026-06-05)

Next.js + Prisma recipe app ("Our Family Table"), live at **craicnkuche.com** (Vercel).
Prod DB = **Neon Postgres**. Local dev DB = Docker `studio1-postgres` on **localhost:5435**.
Branch `main` == `origin/main`, working tree clean. Latest commit: `74ebd7c`.

## 1. What we accomplished
- Resumed prior session; confirmed studio1 is a Next.js app (the global Rust rules don't apply).
- Verified the Gemini-era TS/build fixes were real & committed (`f6657d6`); `npm run build` green.
- **Rebased** local `main` onto origin's 7-commit test-suite PR; pushed (clean FF).
- **Fixed pre-existing `tsc` errors** in `tests/calendar-utils.test.ts` + `tests/api-utils.test.ts` → `tsc --noEmit` 0 errors.
- **Repaired the CLI admin tooling**: `reset-admin-password.ts` now loads `.env.local`, and scopes its Prisma selects so schema drift can't crash it.
- Removed throwaway codemods `fix-params.mjs` / `fix-params-2.mjs`.
- **Root-caused & fixed prod login** ("credentials are incorrect"): prod `User` table was missing `emailVerified`; `authorize()`'s bare select-all `findUnique` threw P2022 → caught → `return null`. Added the column → credential login works.
- **Aligned prod schema fully**: added `Account` + `Session` tables, made `User.password` nullable, added indexes + FKs. `migrate diff` → in sync (exit 0).
- **Rotated** the prod admin password (verified via bcrypt.compare).
- **Generated a Prisma migration** (`20260605120000_add_nextauth_oauth_support`) and **baselined prod** via `migrate resolve --applied` → `migrate status` = up to date (6 migrations).
- Auto-memory `studio1-deploy-topology` kept current throughout.

## 2. What's left to do
- **Google "Sign in with Google" (prod):** DB side is ready, but it still won't work until:
  1. `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` are set in prod env (`vercel env add … production`), and
  2. redirect URI `https://craicnkuche.com/api/auth/callback/google` is registered in Google Cloud Console. (Needs the user's Google creds.)
- **Change the admin password in-app** (Settings → Security) — the rotated value is exposed in this session's transcript; change it for true privacy.
- *(Optional)* Baseline the **local** dev DB — it's `db push`-managed (no `_prisma_migrations`), so `migrate dev` will detect drift locally.
- *(Optional)* History cleanup for from-scratch reproducibility: rolled-back duplicate `add_admin_system` rows in prod `_prisma_migrations`; `FavoriteRecipe` was added via loose `manual_add_favorite_recipes.sql` (not a tracked migration).

## 3. Key decisions made
- **Kept `meals` (not `plannedMeals`)** in `weekly-summary/route.ts` — the schema names that relation `meals` on `MealPlan`. Rejected the handoff's rename (it would have broken a working query; `tsc` confirmed).
- **Contained the `tsc` test fixes test-side** (explicit type args / corrected fixtures) rather than widening `validateRequestBody(schema: any)` — avoids rippling type errors into the 3 app call sites.
- **Used targeted additive SQL** (`ALTER … ADD COLUMN`, `db execute` of `migrate diff` output) for prod — non-destructive, vs `migrate deploy` (no migration existed) or `db push` (could drop).
- **Baselined via hand-authored migration + `migrate resolve --applied`** — records history without re-running SQL on prod.
- Restored local `.env.local` after every prod operation (never leave dev pointed at prod).

## 4. Gotchas for next session
- **Prisma CLI reads `.env`, NOT `.env.local`** → fails P1012/P2010. Pass `DATABASE_URL=…` inline or `--from-url`/`--url`.
- **Prisma Client in `tsx` scripts doesn't auto-load env** → scripts must `dotenv.config({ path: '.env.local' })` BEFORE instantiating PrismaClient.
- `.env.local` normally points at **local Docker (localhost:5435)**; `vercel env pull --environment=production` **overwrites** it with the Neon prod URL — always back up & restore.
- **Bare `findUnique`/`update` (Prisma select-all) crashes on any drifted column** — scope `select` to needed fields (this caused the login bug).
- Vercel **auto bot-mitigation 429-challenges server-side curl** to prod (`x-vercel-mitigated: challenge`, "Vercel Security Checkpoint") — that's about datacenter requests, NOT real browsers. Attack Mode is **off**. Don't mistake it for an app error.
- Prod login path (`src/lib/auth.ts` `authorize()`) swallows ALL errors → `return null` → NextAuth reports "credentials incorrect." A DB error there looks like a wrong password.
- Use **Node 22** (verified v22.22.2).

## 5. Key files touched
- `scripts/reset-admin-password.ts` — load `.env.local` via dotenv; scoped `findUnique`/`update` selects (commits `a140a45`, `cd564fe`).
- `tests/calendar-utils.test.ts` — `PlannedMeal` fixtures use `mealPlanId`/`isCompleted` (was `userId`/`scheduledTime`) (`b7231a0`).
- `tests/api-utils.test.ts` — explicit type args on `validateRequestBody<…>` (`b7231a0`).
- `prisma/migrations/20260605120000_add_nextauth_oauth_support/migration.sql` — NEW migration recording NextAuth/OAuth schema (`74ebd7c`).
- Deleted `fix-params.mjs`, `fix-params-2.mjs` (`2efc2e3`). Left `fix-params.ps1` (pre-existing).
- **Prod DB (not files):** added `User.emailVerified`; created `Account`/`Session`; `User.password` nullable; added indexes + FKs; rotated admin password.
