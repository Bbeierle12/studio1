# Migration Runbook — schema-history rebuild + review hardening

This branch rebuilds the Prisma migration history and adds the schema changes from
the review (`FIX-PLAN.md` tasks 7, 20–23). **Read this fully before touching production.**

## Why the history was rebuilt

The previous `prisma/migrations/` was unusable: only ~9 of 27 models had migrations,
the early ones were **SQLite syntax** under a `postgresql` lock, one ALTERed a table no
migration created, and a loose `manual_add_favorite_recipes.sql` was never run by
`migrate deploy`. A fresh database could not be provisioned from it. The old files are
preserved under `prisma/migrations-legacy-broken/` for reference and are no longer on
the active migration path.

The new history is two migrations:

- `00000000000000_baseline/` — the **current production schema** (generated from
  `main`'s `schema.prisma` via `prisma migrate diff --from-empty`). Represents what
  prod already has; it is **never run against prod** (see below), only used to
  provision fresh environments.
- `20260714120000_review_schema_hardening/` — the actual changes:
  - `Recipe.difficulty` `String?` → `Difficulty` enum (`Easy|Medium|Hard`), **data-preserving**.
  - Real FK relations with `ON DELETE CASCADE` for `CsrfToken`, `PasswordHistory`,
    `WebAuthnCredential`, `WebAuthnChallenge`, `Household.ownerId`,
    `FamilyDigest.householdId`, `CookingSession.userId/recipeId`.
  - `WeatherCache` unique key `(date)` → `(date, latitude, longitude)`.
  - Dropped the useless B-tree indexes on JSON-string columns (`tags`, `allergyTags`, `dietaryFlags`).

## What was validated locally

Applied against a throwaway local Postgres with adversarial seed data (recipes with
`Easy/Medium/Hard/NULL` and an invalid `'medium'`; orphaned WebAuthn/CSRF/CookingSession
rows; a to-be-deleted user). Confirmed via Prisma Client:

- Difficulty preserved (`Easy/Medium/Hard` kept, the invalid `'medium'` set to `NULL`).
- Orphan rows removed before FK creation; all 8 FK constraints created.
- `ON DELETE CASCADE` works (deleting a user removed their recipes/creds/sessions/tokens).

> Note: the hand-corrected migration differs from raw `prisma migrate diff` output in two
> important ways — it uses `ALTER COLUMN ... TYPE ... USING` instead of `DROP COLUMN`
> (the auto version **wipes all difficulty data**), and it deletes orphan rows before each
> `ADD CONSTRAINT` (the auto version **fails** if any orphan exists). Do not regenerate it.

## ⚠️ This migration mutates data — review before prod

The change migration intentionally **deletes** rows that reference a non-existent parent
and **nulls** invalid difficulty values. These rows are already broken/unreachable, but
you should see the blast radius first. Run these read-only counts against prod:

```sql
SELECT count(*) FROM "Recipe" WHERE difficulty IS NOT NULL AND difficulty NOT IN ('Easy','Medium','Hard'); -- will be nulled
SELECT count(*) FROM "CsrfToken" t          WHERE t."userId" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "User" u WHERE u.id=t."userId");
SELECT count(*) FROM "PasswordHistory" t    WHERE t."userId" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "User" u WHERE u.id=t."userId");
SELECT count(*) FROM "WebAuthnCredential" t  WHERE t."userId" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "User" u WHERE u.id=t."userId");
SELECT count(*) FROM "WebAuthnChallenge" t   WHERE t."userId" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "User" u WHERE u.id=t."userId");
SELECT count(*) FROM "Household" t           WHERE t."ownerId" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "User" u WHERE u.id=t."ownerId");
SELECT count(*) FROM "FamilyDigest" t        WHERE t."householdId" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "Household" h WHERE h.id=t."householdId");
SELECT count(*) FROM "CookingSession" t      WHERE (t."userId" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "User" u WHERE u.id=t."userId"))
                                                OR (t."recipeId" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "Recipe" r WHERE r.id=t."recipeId"));
```

If any count is non-trivial, investigate before proceeding.

## Production apply procedure

Do this in a maintenance window, with the DB owner, **after a backup**.

```bash
# 0. BACKUP — non-negotiable.
pg_dump "$DATABASE_URL" -Fc -f studio1-pre-migration-$(date +%Y%m%d).dump

# 1. Confirm prod actually matches the baseline (expect: no differences / exit 0).
npx prisma migrate diff \
  --from-url "$DATABASE_URL" \
  --to-migrations prisma/migrations/00000000000000_baseline \
  --shadow-database-url "$SHADOW_DATABASE_URL" --exit-code
#   If this reports drift, STOP — prod is not the shape the baseline expects.

# 2. Reconcile the migration bookkeeping. Prod's _prisma_migrations table still lists the
#    old (deleted) migration names. Clear it and record the new baseline as already-applied
#    so migrate deploy does NOT try to recreate existing tables:
psql "$DATABASE_URL" -c 'DELETE FROM "_prisma_migrations";'
npx prisma migrate resolve --applied 00000000000000_baseline

# 3. Apply ONLY the change migration.
npx prisma migrate deploy       # runs 20260714120000_review_schema_hardening

# 4. Verify: status clean and no drift vs schema.prisma.
npx prisma migrate status
npx prisma migrate diff --from-url "$DATABASE_URL" \
  --to-schema-datamodel prisma/schema.prisma --exit-code    # expect exit 0
```

## Rollback

If step 3 fails or verification shows drift:

```bash
# Restore from the backup taken in step 0.
pg_restore --clean --if-exists -d "$DATABASE_URL" studio1-pre-migration-YYYYMMDD.dump
```

The change migration is not wrapped in a single transaction (it contains index and type
changes); treat the backup as the rollback mechanism, not a partial revert.

## Fresh / CI environments

No reconciliation needed — `npx prisma migrate deploy` against an empty database runs
`baseline` then the change migration and produces the full current schema.
