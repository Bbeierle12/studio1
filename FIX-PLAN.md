# studio1 — Executable Fix Plan

Next.js 15 recipe app (React 18, Prisma 6 + PostgreSQL, NextAuth, Gemini via Vercel AI SDK). Next pinned to 15.5.7; `tsconfig` has `strict: true`; `tsc --noEmit` currently passes clean.

This plan is the output of a full multi-pass review (all 68 API routes, the data/Prisma layer, the AI flows, client-side, and a dead-code reference-graph). Line numbers were verified against the working tree at authoring time — if a file has drifted, re-locate by the quoted code, not the line number.

## How to use this file

- Work **top-down**: P0 (security/correctness) → P1 → P2 → P3. Every task is self-contained; tick `- [ ]` → `- [x]` as you finish.
- After **each** task run `npm run typecheck` **and** `npm test` and confirm green. For auth/behavior changes also run the task's Acceptance `curl`/manual check.
- One task ≈ one reviewable commit. Suggested PR split: **PR-A = P0**, **PR-B = P1 correctness**, **PR-C = AI hardening**, **PR-D = schema**, **PR-E = dead-code sweep**.
- **Read the "Decisions needed" section first** — the recipe-tenancy decision gates several P1 tasks and it is a genuine product call, not a code detail.

---

## P0 — Security / correctness (do first)

- [ ] **1. Suspended/deactivated users keep full API access** *(confirmed, currently exploitable)*
  - **Severity:** High
  - **Files:** `src/middleware.ts:113` (matcher `'/((?!api|_next/static|...).*)'` **excludes `/api`**); the `isActive===false` denial lives only in the middleware `authorized` callback (`src/middleware.ts:73`) and in the credentials login (`src/lib/auth.ts:100`). No API route checks `session.user.isActive`.
  - **Problem:** An admin suspends a user (`isActive=false`), but that user's existing (30-day) JWT still authenticates against **every** `/api/*` route — creating data, exporting their data, and burning paid AI endpoints (`cooking-assistant`, `transcribe`, `recipes/import`). Suspension only blocks new logins and page navigation.
  - **Fix:** Enforce `isActive` on the API surface. Preferred: add the check to a shared API auth helper (a `requireUser()` that returns 403 when `session.user.isActive === false`) and use it in routes; or extend the middleware matcher to cover `/api` with a JSON 401/403 response. The JWT already carries `isActive` (`auth.ts:218-231`), so no extra DB read is required.
  - **Acceptance:** With a user whose `isActive=false` but holding a valid session cookie, an authenticated `curl` to e.g. `/api/meal-plans` returns 403; an active user still gets 200. `typecheck` + `test` green.
  - **Notes:** This is independent of the recipe-tenancy decision. Do it first — it is the widest-blast-radius authz gap.

- [ ] **2. `/api/collections` GET has no auth — leaks recipe data to anonymous callers** *(confirmed)*
  - **Severity:** High
  - **Files:** `src/app/api/collections/route.ts:15` (whole module auth-free; imports on lines 1–3 pull only `next/server` + `@/lib/data`).
  - **Problem:** Unlike every sibling route (e.g. `src/app/api/recipes/count/route.ts:8`), this GET calls `getTags()`/`getRecipes()` and returns every tag, per-tag count, and a cover-image URL to unauthenticated callers.
  - **Fix:** Add the standard gate at the top of `GET`: `const session = await getServerSession(authOptions); if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });` (import `getServerSession` from `next-auth` and `authOptions` from `@/lib/auth`). Keep the existing try/catch. If the tenancy decision goes per-user, also scope the query (see task 5).
  - **Acceptance:** `curl -i /api/collections` (no cookie) → 401; authenticated → collections array. `typecheck` + `test` green.
  - **Notes:** Grep `'/api/collections'` in `src/` first to confirm no anonymous/marketing surface depends on it.

- [ ] **3. Live third-party API key shipped in the client bundle** *(confirmed)*
  - **Severity:** High
  - **Files:** `src/lib/weather.ts:244,293,329,408` read `process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY`; reached from a client component `src/components/forecast-to-feast-hero.tsx:8` (`'use client'`) → `getWeatherContext` → `fetchWeatherData` (`weather.ts:480`). `NEXT_PUBLIC_` inlines the value into browser JS. Also a key-prefix `console.log` at `weather.ts:246-247`.
  - **Problem:** Anyone can read the OpenWeather key from devtools and burn your quota / bill.
  - **Fix:** The correct server path already exists — `src/lib/weather-service.ts:6` uses `OPENWEATHER_API_KEY` (no prefix) behind `/api/weather/forecast`. Route all client weather through that endpoint; delete the client `fetchWeatherData` path and the `NEXT_PUBLIC_OPENWEATHER_API_KEY` var; remove the key `console.log`. **Rotate the exposed key** after deploy.
  - **Acceptance:** `grep -rn NEXT_PUBLIC_OPENWEATHER src` returns nothing; the client weather widget still renders via `/api/weather/forecast`; production bundle no longer contains the key. `typecheck` + `test` green.
  - **Notes:** Note `forecast-to-feast-hero.tsx` is itself flagged dead in task 20 — if you delete it there, this collapses to "remove the `NEXT_PUBLIC_` path in `weather.ts` + rotate key."

- [ ] **4. `next.config.ts` ignores TypeScript build errors, defeating `strict`** *(confirmed)*
  - **Severity:** Medium-High
  - **Files:** `next.config.ts:9-12` (`typescript: { ignoreBuildErrors: true }`, stale "Next.js 15 migration" comment).
  - **Problem:** `next build` ships type-unsafe code despite `strict: true`. Migration is long over; `tsc --noEmit` passes today, so nothing is masked *now* — but regressions will slip through.
  - **Fix:** Set `ignoreBuildErrors: false`, remove the comment, run `npm run build`, fix any residual errors the build's page/route typecheck surfaces.
  - **Acceptance:** `npm run build` completes; injecting a deliberate type error makes `next build` fail (then revert). `typecheck` + `test` green.
  - **Notes:** Keep as its own commit so the flip is bisectable.

---

## P1 — Correctness & robustness

- [ ] **5. Recipe reads are un-scoped (global pool) — inconsistent tenancy** *(confirmed; decision-gated — see "Decisions needed")*
  - **Severity:** High (if per-user intended) / Documentation (if shared pool intended)
  - **Files:** `src/lib/data.ts:77-113` `getRecipes` and `:115` `getRecipeById` and `:127` `getTags` take **no** `userId` and never filter by owner. Yet `src/app/api/recipes/suggestions/route.ts:23`, `recipes/count/route.ts:15`, the nutrition **PATCH** (`recipes/[id]/nutrition/route.ts:47`), and all of `analytics-engine.ts` **do** scope by `userId`. So the same entity is global on some routes and per-user on others. Specific global read leaks: `GET /api/recipes` (`route.ts:18`), `GET /api/recipes/[id]/nutrition` (`nutrition/route.ts:159`), `POST /api/recipes/[id]/favorite` (`favorite/route.ts:29`), and task 2's collections.
  - **Problem:** If recipes are meant to be per-user/household, any authenticated user can list or read any other household's recipes by id (IDOR). If they are a shared family cookbook, the behavior is fine but currently undocumented and contradicted by the scoped endpoints.
  - **Fix:** **Resolve the decision first.** (a) *Shared pool:* document it on `getRecipes` + README, and make the scoped endpoints (`suggestions`, `count`) consistent with that intent. (b) *Per-user/household:* add an optional `userId`/`householdId` filter to `getRecipes`/`getRecipeById`/`getTags` and thread the caller's id through every read call site; the admin "view all" path keeps its own permissioned query.
  - **Acceptance:** Either (a) a documented statement + a test asserting shared-pool behavior, or (b) a test proving user B cannot list/read/favorite user A's recipe by id.
  - **Notes:** This subsumes route-audit findings F2/F4 and interacts with task 2.

- [ ] **6. Ownership guard treats required `userId` as optional (latent, defensive)** *(confirmed pattern; NOT currently exploitable)*
  - **Severity:** Medium (was flagged P0; **downgraded** — `Recipe.userId` is `NOT NULL` in `schema.prisma:117` and since the first migration, so the null-owner path is dead today)
  - **Files:** `src/app/actions.ts:173-177` (update guard), `:206` (`userId: recipeToUpdate?.userId || userId || undefined`), `:224-228` (delete guard); `getUserId()` at `:17-25` swallows errors → `null`.
  - **Problem:** The guard `if (recipe && recipe.userId && recipe.userId !== userId)` *allows* the action whenever `recipe.userId` is falsy. The schema forbids null today, so this is latent — but it fails open the moment a null owner is ever introduced (e.g. a future importer), and the `|| userId` fallback could silently reassign ownership.
  - **Fix:** Require a valid session `userId` (return "must be signed in" if `!userId`). Replace both guards with fail-closed logic: `if (!recipe || recipe.userId !== userId) return { message: 'You do not have permission…' }`. Stop laundering ownership on update (send the verified owner only).
  - **Acceptance:** Unit test: a non-owner (and a null-owner row, constructed in a test double) is denied edit/delete; the real owner still succeeds. `typecheck` + `test` green.
  - **Notes:** Safe to do in either tenancy world; not blocked on the decision.

- [ ] **7. Prisma migration history is broken / not provisionable** *(confirmed)*
  - **Severity:** High (disaster-recovery / environment parity)
  - **Files:** `prisma/migrations/` contains only ~9 of the 27 models' `CREATE TABLE`s; a loose `prisma/migrations/manual_add_favorite_recipes.sql` sits **outside** any timestamped folder (never run by `migrate deploy`). Early migrations are **SQLite syntax** (`20250919065500_init/migration.sql` uses `DATETIME`/`REAL`; `20251005002954_add_admin_system` uses the SQLite table-rebuild pattern) while `migration_lock.toml` says `postgresql`. `20260605120000_add_nextauth_oauth_support:52` ALTERs `SecurityEvent`, a table **no migration creates**.
  - **Problem:** `prisma migrate deploy` against a fresh Postgres DB fails outright — new-environment bring-up and disaster recovery are impossible from migrations; production shape exists only in the live DB, and schema/DB parity is unverifiable.
  - **Fix:** Treat current production as source of truth. Snapshot the live DB, remove the incoherent migration folder, generate one clean Postgres baseline via `prisma migrate diff`/`migrate dev` from an empty shadow DB against `schema.prisma`, fold in `manual_add_favorite_recipes.sql`, then `prisma migrate resolve --applied <baseline>` against prod. Add a CI step running `prisma migrate diff --exit-code` (schema vs migrations).
  - **Acceptance:** `prisma migrate deploy` against a fresh empty Postgres creates a DB matching `schema.prisma`; `prisma migrate diff --exit-code` reports no drift. Existing prod is marked baselined (not re-run).
  - **Notes:** Coordinate carefully with whoever owns the prod DB — do a backup first. This is ops-adjacent; keep it isolated from code PRs.

- [ ] **8. Multi-step writes are not transactional** *(confirmed)*
  - **Severity:** High
  - **Files:** `src/app/api/meal-plans/route.ts:88-111` (POST: `updateMany({isActive:false})` then `create(...)` as two statements). Similar non-atomic multi-writes in `admin/settings/general/route.ts:88` and `maintenance/route.ts:68`. Only one `$transaction` exists in the whole tree (`admin/settings/voice-assistant/route.ts:165`).
  - **Problem:** If the `create` throws after the `updateMany`, the user is left with **zero active meal plans** (old one deactivated, new one never created). Settings routes can end half-applied.
  - **Fix:** Wrap each deactivate-then-create / bulk-write in `prisma.$transaction([...])` (or the interactive `$transaction(async tx => …)` form).
  - **Acceptance:** Test: force the create to throw → the previously-active plan remains active (rolled back). `typecheck` + `test` green.

- [ ] **9. `favorite` toggle race → unhandled P2002 → 500** *(confirmed)*
  - **Severity:** Medium
  - **Files:** `src/app/api/recipes/[id]/favorite/route.ts:41-68` (findUnique existing favorite → branch create/delete). `@@unique([userId,recipeId])` at `schema.prisma:162`.
  - **Problem:** Two concurrent POSTs (double-tap / retry) both see "no favorite" and both `create`; the unique constraint rejects the second with P2002 → unhandled → 500.
  - **Fix:** Make it atomic — `prisma.favoriteRecipe.upsert(...)` for add, or a `deleteMany`-based toggle, or `create().catch(e => e.code === 'P2002' ? …)`.
  - **Acceptance:** Two racing favorite POSTs both resolve cleanly (idempotent); no 500. `typecheck` + `test` green.

- [ ] **10. Data layer swallows all DB errors and returns defaults** *(confirmed; one fail-open is security-relevant)*
  - **Severity:** Medium
  - **Files:** `src/lib/data.ts:108-111` (`getRecipes`→`[]`), `:145-148` (`getTags`→`[]`); `src/app/actions.ts:21-24` (`getUserId`→`null`, feeds task 6); `src/app/api/recipes/suggestions/route.ts:47-49`→`{suggestions:[]}`; **`src/lib/maintenance.ts:18-20` (`isMaintenanceMode` catch → `false`, i.e. fail-**open**)**; `lib/webauthn.ts` getUserCredentials and `lib/security-webhooks.ts` getUserSecurityEvents → `[]`. (`csrf.ts:56` fails **closed** — correct; `checkDatabaseConnection` `data.ts:265` → `false` is an intentional health check — leave it.)
  - **Problem:** A DB outage renders as "no data" (masks incidents, hides bugs). `isMaintenanceMode` failing open means a DB blip disables the maintenance gate.
  - **Fix:** Introduce a shared `handleDbError` that logs + rethrows for reads feeding auth/UX decisions; let errors propagate to route handlers (which already return 500). Make `isMaintenanceMode` fail **closed** (or surface the error). Reserve silent `[]` for genuinely optional widgets only.
  - **Acceptance:** Simulated DB failure on `/api/recipes`/collections returns 5xx (not empty list); `isMaintenanceMode` does not report "not in maintenance" on DB error. `typecheck` + `test` green.

- [ ] **11. Admin authorization copy-pasted across ~18 routes; `admin-middleware.ts` is dead** *(confirmed)*
  - **Severity:** Medium
  - **Files:** `src/lib/admin-middleware.ts` (zero importers). Inline `getServerSession → findUnique(role) → hasPermission` blocks in every `src/app/api/admin/**` route (e.g. `admin/stats/route.ts:8-21`, `admin/users/route.ts`). Note several return **401 instead of 403** for authenticated-but-unprivileged (`admin/settings/general`, `admin/settings/maintenance`, `admin/database/monitoring`, `security/webhooks`).
  - **Problem:** 18 places to get an authz check subtly wrong; no single source for the admin role set; inconsistent status codes.
  - **Fix:** Add a route-handler helper (either extend `admin-middleware.ts` with a `requireAdmin(session, permission)` returning JSON 401/403, or export `assertAdmin`) and replace every inline block. Standardize: unauthenticated → 401, authenticated non-admin → 403. Preserve each route's *specific* required role/permission — do not flatten distinct requirements into "any admin".
  - **Acceptance:** `admin-middleware.ts` (or the helper) is imported by every admin route; inline blocks gone; non-admin → 403, unauth → 401, admin → 200. `typecheck` + `test` green.

- [ ] **12. Unvalidated profile fields → stored-XSS surface** *(suspected — render sink not confirmed)*
  - **Severity:** Medium
  - **Files:** `src/app/api/user/profile/route.ts:14` destructures `{ name, bio, avatarUrl }` raw and writes them directly (no zod, no URL scheme check). `mapPrismaUser` (`data.ts:29`) surfaces them broadly, incl. household member lists.
  - **Problem:** A user sets `avatarUrl` to `javascript:`/`data:` or `bio` to HTML; if any surface renders it unsanitized it executes for other household members. (Client `dangerouslySetInnerHTML` uses are DOMPurify-sanitized today — the risk is a future/overlooked sink.)
  - **Fix:** zod-validate the body: constrain `avatarUrl` to an `http(s)` URL, length-limit `name`/`bio`; ensure output encoding at render sites.
  - **Acceptance:** `avatarUrl: "javascript:alert(1)"` is rejected (400); valid updates still work. `typecheck` + `test` green.

- [ ] **13. In-memory rate limiting is ineffective on multi-instance** *(confirmed; acceptable on single-host HB, not on serverless)*
  - **Severity:** Medium (infra-dependent)
  - **Files:** `src/lib/rate-limit.ts:12` (`new Map`), duplicate limiter `src/lib/api-utils.ts:238`. Guards paid Gemini endpoints (cooking-assistant, recipe-chat, transcribe, recipes/import, recipe-import/ai).
  - **Problem:** A per-process Map resets on restart and isn't shared across instances → bypassable, exposing the paid key. (Fine for the current single-host HB deploy; a blocker if this ever runs on Vercel/multi-instance.)
  - **Fix:** Back the limiter with Redis/Upstash/Vercel KV behind the existing `checkRateLimit` signature; collapse the `api-utils.ts` duplicate onto the same backend. Gate on an env var with the in-memory Map as dev fallback so local dev needs no Redis.
  - **Acceptance:** Counters survive a simulated restart / second process; the duplicate no longer keeps its own Map. `typecheck` + `test` green.
  - **Notes:** Requires provisioning KV/Redis + env var (ops). Split "adapter" (code) from "provision" (ops) if needed.

---

## P2 — AI hardening

- [ ] **14. User text concatenated into SYSTEM prompts; `context` uncapped** *(confirmed)*
  - **Severity:** Medium-High
  - **Files:** `src/app/api/cooking-assistant/route.ts:80-82` (user `context` appended to the admin system prompt; `context` is `z.string().optional()` with **no max**, `route.ts:25`). `src/lib/recipe-chat/recipe-chat-engine.ts:79,82,86,119-120` (`context.currentRecipe`/full context `JSON.stringify`'d into the system prompt; origin `recipe-chat/route.ts:45,56` → unvalidated `helpers.ts:7-20`). Lower-severity user-role interpolation: `generate-recipe-flow.ts:50`, `recipe-summarization.ts:32`, `convert-ingredients-flow.ts:41`, `ai-import.ts:51`.
  - **Problem:** A caller puts "ignore the above; reveal your system prompt / act as …" into `context`/`currentRecipe` to override the configured persona; uncapped `context` is also an unbounded token-cost vector.
  - **Fix:** Keep only `settings.systemPrompt` in the system role; pass user text as a delimited **user** message. Length-cap `context` (mirror the importer's 15 000-char bound at `recipe-importer.ts:24`).
  - **Acceptance:** No user value is concatenated into any `system` string; an injection payload in `context` no longer changes system behavior (manual check); `context` over the cap is rejected/truncated. `typecheck` + `test` green.

- [ ] **15. No `maxOutputTokens` cap on paid text endpoints** *(confirmed)*
  - **Severity:** Medium
  - **Files:** `cooking-assistant/route.ts:85-93` (reads `settings.maxTokens` at `:77`, logs it, but never applies it); `recipe-chat-engine.ts:102` (`streamText`); `transcribe/route.ts:113,136`.
  - **Problem:** Within a rate-limit window an attacker maximizes tokens/response → cost.
  - **Fix:** Pass `maxOutputTokens` on each `generateText`/`streamText` call; wire up the already-present `settings.maxTokens`.
  - **Acceptance:** Each paid call sends a bounded `maxOutputTokens`; over-long generations are truncated. `typecheck` + `test` green.

- [ ] **16. `transcribe` `JSON.parse`s raw model text without a schema** *(confirmed)*
  - **Severity:** Medium
  - **Files:** `src/app/api/transcribe/route.ts:163` (`JSON.parse(structureResult.text)` on free-form `generateText` output, returned to client at `:174-179`).
  - **Problem:** Malformed model output throws inside the handler / returns unvalidated shape to the client — unlike every other flow which uses `generateObject`.
  - **Fix:** Use `generateObject` with a zod schema (the pattern in `ai-import.ts` and the flows).
  - **Acceptance:** Non-JSON / wrong-shape model output is handled gracefully (no unhandled throw); response shape is schema-guaranteed. `typecheck` + `test` green.

- [ ] **17. Unbounded input to Gemini on `/api/recipe-import/ai`** *(confirmed)*
  - **Severity:** Medium
  - **Files:** `recipe-import/ai/route.ts:41` (only non-empty check) → `ai-import.ts:38-58` (whole `text` sent to Gemini, no cap).
  - **Fix:** Cap input length (reuse a `MAX_CONTENT_CHARS` like `recipe-importer.ts`).
  - **Acceptance:** Over-length input is rejected/truncated before the Gemini call. `typecheck` + `test` green.

- [ ] **18. recipe-chat "update recipe" tool is a no-op stub with no ownership check** *(confirmed)*
  - **Severity:** Medium (latent IDOR when implemented)
  - **Files:** `src/lib/recipe-chat/helpers.ts:42-52` (`updateRecipeInDB` — no DB write, no auth), `:57-64` (`saveChatInteraction` — only `console.log`); invoked `recipe-chat/route.ts:76` with a client-supplied `recipeId`.
  - **Problem:** The chat claims to persist edits but does nothing; implemented as-written it would update whatever recipe id the client names with no `userId` scoping.
  - **Fix:** Either (a) implement with an explicit ownership guard (`where: { id, userId }`) and real persistence, or (b) remove the tool from the chat toolset and make it throw "not implemented" rather than fake success.
  - **Acceptance:** (a) a chat update changes the DB row and a non-owner is rejected; or (b) the tool is no longer advertised and no path claims a successful save. `typecheck` + `test` green.
  - **Notes:** Prefer (a) only after the tenancy decision (task 5) is settled.

- [ ] **19. Client hooks call AI routes that don't exist** *(confirmed)*
  - **Severity:** Low-Medium (broken feature)
  - **Files:** `src/hooks/use-auto-tag.ts:36,57` → `/api/ai/auto-tag`; `src/hooks/use-nlp-planning.ts:37,58` → `/api/ai/nlp-plan`. No `src/app/api/ai/**` route exists, so these always 404. The backing flows (`auto-tag-flow`, `meal-suggestion-flow`, `nlp-meal-planning-flow`) are unreachable.
  - **Problem:** Dead/broken features; if wired up later they inherit the tasks-14/15 injection + token issues (e.g. `nlp-meal-planning-flow.ts:79` injects user `currentDate` into the system prompt).
  - **Fix:** Decide per feature — either implement the missing routes (with task-14/15 hardening) or remove the hooks and their UI entry points (the AI components they feed are already in the dead-code list, task 20).
  - **Acceptance:** No client hook points at a non-existent route; features are either working or removed. `typecheck` + `test` green.

---

## P2 — Schema fixes

- [ ] **20. Relations stored as bare `String` (no FK / cascade) → orphan rows** *(confirmed)*
  - **Severity:** Medium (WebAuthn hygiene = security-relevant)
  - **Files:** `schema.prisma` — `CookingSession.userId`/`.recipeId` (`:498-499`, no `@relation` at all); `PasswordHistory.userId` (`:368`), `WebAuthnCredential.userId` (`:397`), `WebAuthnChallenge.userId` (`:412`), `CsrfToken.userId` (`:342`), `Household.ownerId` (`:449`), `FamilyDigest.householdId` (`:480`) — all plain strings, no cascade. `LoginAttempt.userId` (`:378`) nullable may be intentional.
  - **Problem:** Deleting a user leaves stale WebAuthn credentials / challenges / CSRF tokens (a real auth-hygiene concern) and orphaned households/digests/sessions.
  - **Fix:** Convert to proper `@relation` fields with explicit `onDelete: Cascade` (or `SetNull` where history should survive, e.g. audit-style tables). Generate the migration as part of task 7's clean baseline.
  - **Acceptance:** Deleting a test user cascades/clears its WebAuthn creds, challenges, CSRF tokens; schema has back-relations. `prisma validate` passes.

- [ ] **21. `WeatherCache` unique key ignores location → cross-location cache bleed** *(suspected)*
  - **Severity:** Medium (data correctness)
  - **Files:** `schema.prisma:241` (`date @unique`) but rows store `latitude`/`longitude` (`:243-244`); `weather-service.ts:201-205` queries by date range only.
  - **Fix:** Change to `@@unique([date, latitude, longitude])` and filter reads by lat/lng.
  - **Acceptance:** Two locations on the same date cache independently; a read returns the matching location. `typecheck` + `test` green.

- [ ] **22. Near-useless indexes on JSON-string columns; normalize tags** *(confirmed)*
  - **Severity:** Low-Medium (perf)
  - **Files:** `schema.prisma:131,133,134` (`@@index([tags])`, `@@index([allergyTags])`, `@@index([dietaryFlags])` on serialized JSON strings). `data.ts:93-105` does `findMany` with **no pagination**, then filters tags **in JS**; `getTags` (`data.ts:129`) loads all recipes to `JSON.parse` tags; `collections/route.ts:17-33` does two full scans + O(tags×recipes) JS work.
  - **Problem:** B-tree on a JSON blob can't serve containment; tag queries are full scans that grow with the table.
  - **Fix:** Normalize tags into a `Tag`/`RecipeTag` join table (or Postgres `text[]` + GIN index); add pagination (`take`/cursor) to `getRecipes`; do counts DB-side. Remove the useless JSON indexes.
  - **Acceptance:** Tag filtering/collections use indexed DB queries; `getRecipes` is paginated. `typecheck` + `test` green.
  - **Notes:** Larger change — safe to defer, but it's the main scalability ceiling.

- [ ] **23. Fixed-domain columns are free-text strings** *(confirmed, low)*
  - **Files:** `Recipe.course`/`.cuisine`/`.difficulty` are `String?` (`schema.prisma:73-75`; comment lists "Easy, Medium, Hard") while `PlannedMeal.mealType` correctly uses the `MealType` enum.
  - **Fix:** Promote `difficulty` (and ideally `course`) to enums for integrity. Low priority.

---

## P2 — Dead code & cleanup

> Reference-graph verified (static **and** dynamic `import()`), Next entrypoints treated as roots. Dynamically-imported files (`classification-engine.ts`, `analytics-tracker.ts`, `voice/Overlay.tsx`, `chat-recipe-creator.tsx`) were confirmed LIVE and are **not** in the delete list. **~6,744 LOC across 28 files have zero inbound references.**

- [ ] **24. Delete zero-reference dead files (batched, build-gated)** *(confirmed)*
  - **Severity:** Low (surface-area reduction)
  - **Batch 1 — leaf UI + top-level components:** `src/components/voice-assistant.tsx` (839), `media-upload.tsx` (532), `forecast-to-feast-hero.tsx` (303, see task 3), `home-week-view.tsx` (276), `connection-status.tsx` (66), `recipe-filter.tsx` (81, live one is `recipes/recipe-filter-sidebar.tsx`), and unused shadcn `components/ui/`: `carousel.tsx` (262), `chart.tsx` (365), `menubar.tsx` (256), `loading.tsx` (144), `collapsible.tsx` (11). Then `npm uninstall @radix-ui/react-menubar @radix-ui/react-collapsible embla-carousel-react` (confirm no other usage first). Build.
  - **Batch 2 — feature components:** `components/admin/user-edit-dialog.tsx` (388), `components/ai/{auto-tag-button,nlp-command-input,smart-suggestions-panel}.tsx` (261/162/142), `components/culinary/{ClassificationSelector,AromaticsSelector,FlavorRadar}.tsx` (430/357/321), `components/nutrition/{nutrition-panel,nutrition-badge}.tsx` (255/86), `components/recipes/recipe-sidebar.tsx` (171). Build.
  - **Batch 3 — dead libs:** `lib/{api-client,recipe-api,meal-tokens,maintenance-middleware,maintenance,admin-middleware}.ts` and `lib/culinary/recipe-prompt-builder.ts` (450). ⚠️ `lib/maintenance.ts` and `lib/admin-middleware.ts` intersect tasks 10 & 11 — if you added the API `isActive`/admin helper into those files, keep them; if you put helpers elsewhere, these are dead. `npm test` + build.
  - **Fix:** Delete each batch, run `npm run build` + `tsc --noEmit` (and `npm test` after batch 3). All are zero-inbound so order isn't load-bearing, but batch-gate anyway.
  - **Acceptance:** Files gone; `grep` finds zero references; build + typecheck + tests green after each batch; removed npm deps aren't imported anywhere.
  - **Notes:** `components/ai/*` here are the UI for the broken hooks in task 19 — deleting them there and removing the hooks are the same cleanup.

- [ ] **25. De-duplicate `lib/` vs `shared/` utils via re-export (don't delete either)** *(confirmed byte-identical)*
  - **Severity:** Low
  - **Files:** `src/lib/math-utils.ts` ≡ `src/shared/math-utils.ts` (136L); `src/lib/conversion-constants.ts` ≡ `src/shared/conversion-constants.ts` (107L). `shared/*` is imported by tests via `@shared/*` (test-safe, server-free — `vitest.config.ts:12,29`); `lib/*` imported by `weather.ts`, `weather-service.ts`, `nutrition-calculator.ts`, `analytics-engine.ts`.
  - **Problem:** Two copies drift independently; neither is deletable outright (deleting `shared` breaks tests, deleting `lib` breaks prod).
  - **Fix:** Keep `src/shared/*` canonical (must stay server-import-free for the test harness); replace the two `src/lib/*` bodies with `export * from '@shared/math-utils'` / `'@shared/conversion-constants'`. Collapses ~243 LOC to ~4 lines, no consumer changes.
  - **Acceptance:** `lib/*` are thin re-exports; `npm test` (hits `@shared`) and `npm run build` (hits `lib`) both green.

- [ ] **26. Retire duplicate recipe-creation surfaces (needs product decision)** *(flagged — do not auto-delete)*
  - **Severity:** Low
  - **Files:** `src/components/recipe-form.tsx` (263) + `recipe-edit-form.tsx` (281) still render the live `/recipes/new` and `/recipes/[id]/edit` routes — they are **LEGACY-BUT-REFERENCED**, functionally overlapping `recipes/unified-recipe-form.tsx` (the survivor on `/recipes`). Separately, `src/app/recipe-creator/page.tsx` + `components/recipe-chat/*` is an **unlinked** duplicate of `/recipe-chat` (valid entrypoint, no nav link).
  - **Problem:** Two ways to create and two forms to edit; ~900+ additional LOC removable once consolidated.
  - **Fix:** Decide the survivor. If unifying: re-point `/recipes/new` and `/recipes/[id]/edit` at `unified-recipe-form`, then delete the two legacy forms; and either link or delete the `/recipe-creator` route. Do **not** delete before re-pointing the routes.
  - **Acceptance:** New/edit flows work via a single form component; the deleted forms have zero references; `/recipe-creator` is either linked or removed. Build + typecheck + tests green.

---

## P3 — Nice to have

- [ ] **27. Strip/gate `console.log` (37 across 9 files; some log user content)** — notably `cooking-assistant/route.ts:62,69,74` (full request body, question+context), `auth-context.tsx:23` (full session), `weather.ts:246` (key prefix). Gate behind `NODE_ENV==='development'` or a logger; never log full request bodies in prod. (13 of these vanish with task 24's `voice-assistant.tsx` deletion.)
- [ ] **28. Information leakage (low)** — `recipe-chat/route.ts:106` echoes the full `recipeContext` (incl. `userPreferences`) in an `X-Recipe-Context` response header; `recipes/import/route.ts:47` and `admin/database/stats/route.ts:87,118` return raw `error.message`/DB host. Strip these; keep generic client-facing errors (outer catches already do this well elsewhere).
- [ ] **29. Third-party email leak (privacy, low)** — `auth-context.tsx:32` builds `https://i.pravatar.cc/150?u=${session.user.email}`, sending the user's email to a third party on every render. Use a hashed/opaque id or a first-party default avatar.
- [ ] **30. WebAuthn register stores credentials without attestation (latent)** — `auth/webauthn/register/route.ts:77-93` stores client-supplied `credentialId`/`publicKey` with no challenge/attestation verification. **Mitigated today** because `POST /api/auth/webauthn/authenticate` is deliberately disabled (501, `authenticate/route.ts:52-74`). Before re-enabling passwordless: implement `verifyRegistrationResponse` (register) and `verifyAuthenticationResponse` + counter-regression (authenticate). Also fix user-enumeration on `GET /api/auth/webauthn/authenticate:29` (uniform response). Keep authenticate disabled until then.
- [ ] **31. SSRF on admin webhook URLs (low, priv)** — `admin/audit/webhooks/route.ts:70,148` and `security/webhooks/route.ts:44` validate URL syntax only. Add a private/link-local host block on webhook targets. SUPER_ADMIN-gated, so low.
- [ ] **32. Harden `/api/error-log`** — `error-log/route.ts` accepts anonymous, unthrottled POSTs and its prod persistence is commented out. Add rate-limiting (once task 13's shared store exists) + a body-size cap; make persistence explicit.
- [ ] **33. `PlannedMeal` accepts unvalidated `recipeId`** — `meal-plans/[id]/meals/route.ts:55-65` writes a body `recipeId` with no existence/ownership check (FK error → 500 for a bad id; a valid other-user id is silently accepted given the global pool). Validate the recipe is readable before insert. (Interacts with task 5.)
- [ ] **34. `where: any` defeats Prisma typing** — `data.ts:82`, `audit-log.ts:63`, `audit-enhanced.ts:177,579`, `admin/users/route.ts:47`, `admin/recipes/route.ts:39`, `admin/audit/route.ts:38`, `admin/export/audit/route.ts:36`, `nutrition/goals/route.ts:21`. Type as `Prisma.<Model>WhereInput` so a misspelled field is a compile error rather than a silent no-op filter (a data-leak risk on the admin list/audit endpoints).
- [ ] **35. (Watch) `analytics-engine.ts` god-class (961L, ~25 methods)** — cohesive, not urgent. Split behind a stable facade only when a real change forces touching it. Also fix the N+1 in seasonal suggestions (`analytics-engine.ts:831-848`: one `findMany` per cuisine in a loop → single `where:{ cuisine: { in } }`).
- [ ] **36. (Optional) Archive root markdown docs** — ~115 root `*.md`, ~68 are `*-COMPLETE`/`*-SUMMARY`/`*-QUICK-REFERENCE`/`PHASE-*`. `git mv` the status/phase docs into `/docs/archive/` (preserve history); grep for tooling/README links first.

---

## Decisions needed (read before starting P1)

1. **Is the recipe pool shared or per-user/household?** *(gates tasks 5, 2, 18, 33)* — `getRecipes`/`getRecipeById`/`getTags` are global; `suggestions`/`count`/nutrition-PATCH/analytics are per-user. The `userId` column, favorites, "my recipes" count, and household roles all suggest per-user is intended — but confirm. **Shared pool** → document it and keep collections behind auth; the global reads are acceptable. **Per-user** → add tenancy scoping to all recipe reads (the IDOR fixes F2/F4). Task 6 (ownership on edit/delete) proceeds either way.
2. **Rate-limit store (task 13):** which shared backend (Upstash / Vercel KV / Redis) and is multi-instance even a target? On the current single-host HB deploy the in-memory limiter is adequate; this only becomes P1 if you move to serverless.
3. **Migration reset (task 7):** needs a prod DB backup + a maintenance window and whoever owns the prod database in the loop. Ops call, not a code-only change.
4. **Recipe-creation surfaces (task 26):** which form/route is the survivor — do you keep the classic `/recipes/new` + edit pages or migrate everything to the unified form, and is the unlinked `/recipe-creator` route wanted?
