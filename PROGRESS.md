# Vercel Deployment Progress

## Phase 1: Environment Check and Prisma Schema Configuration

- [x] Check if `vercel` CLI is installed and authenticate
- [x] Update `prisma/schema.prisma` to use the `postgresql` provider for production (already configured)
- [x] Verify the configuration runs type-checking and formats properly

## Phase 2: Project Linkage and Environment Variables Setup

- [x] Link local project to Vercel
- [x] Provision Vercel PostgreSQL database
- [x] Configure required environment variables (`DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `OPENAI_API_KEY`)

## Phase 3: Database Migration and Seeding

- [x] Generate Prisma Client for PostgreSQL
- [x] Run Prisma migrations to deploy database schema to production
- [x] Seed the production database with initial data

## Phase 4: Production Build and Verification

- [x] Execute `vercel --prod` to deploy the application
- [x] Verify the hosted application's URLs and verify authentication is functional

Deployment successful at: **https://www.craicnkuche.com** (the production alias).
Note: the previously listed `studio1-one-eosin.vercel.app` no longer resolves,
and bare `*-bbeierle12s-projects.vercel.app` deployment URLs sit behind Vercel
Deployment Protection (SSO) — use the custom domain for anything public-facing,
including PWA install and the share target.

## Phase 5: Social Media Integration (Web Share API)

- [x] Write failing unit tests for `importRecipeFromUrl` utility
- [x] Implement `/api/recipes/import` backend using OpenAI
- [x] Create `AutoImporter` frontend to automatically fetch, format, and save shared recipes
- [x] Verify types with `tsc --noEmit` and tests with `vitest`

## Phase 7: Social Import Finalization + Gemini-Only Migration (2026-07-13)

Social import (was non-functional end to end):
- [x] No AI key existed in any environment; wired `GOOGLE_GENERATIVE_AI_API_KEY`
      into `.env.local` and all three Vercel environments
- [x] `gemini-1.5-flash` was retired (live 404) → `gemini-3.5-flash`, with a
      `GEMINI_MODEL` override; fixed `@ai-sdk/google` v4/ai-v5 incompatibility
- [x] Fixed the text-share path: response envelope was never unwrapped, and the
      two backends' ingredient shapes disagreed (saved empty/"undefined" recipes)
- [x] Fixed server-side URL import (`parseFromUrl` used a relative fetch → always
      threw in Node); content extraction now prefers the JSON-LD Recipe block
- [x] Auth + rate limits + SSRF guards on both import routes
- [x] PWA share target could never have registered: middleware auth-gated
      `manifest.json`/`sw.js`/icons, and no icons existed. Fixed; icons generated.
- [ ] **Acceptance gate: on-device share test from the phone**

Gemini-only migration:
- [x] All 6 AI flows, recipe-chat engine, cooking assistant, and vision OCR
      migrated to `@ai-sdk/google`
- [x] Per-user OpenAI key feature removed (route, Settings tab, `openai-utils`);
      Prisma migration drops `User.openaiApiKey` — created, applied at deploy
- [x] `@ai-sdk/openai`, `openai`, `@google/generative-ai` removed; CSP no longer
      allowlists api.openai.com
- [x] `tests/gemini-only.test.ts` guards against OpenAI creeping back
- [x] 272 tests green, tsc clean, production build passes

## Phase 6: Full-Time Calendar View

- [x] Refactored `MealPlanningCalendar` to display calendar views independently of active meal plan
- [x] Integrated all user meal plans as clickable markers spanning across the calendar grid
- [x] Updated calendar views to fetch weather based on view date bounds instead of active plan bounds
- [x] Display humidity percentages inside weather cards and day cells
- [x] Auto-activate (Enter plan mode) when a meal plan marker is clicked
- [x] Verify 213 unit tests pass and push to remote
