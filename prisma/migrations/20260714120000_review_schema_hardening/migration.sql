-- Review schema hardening: difficulty enum, FK relations + cascade,
-- WeatherCache location-aware unique key, drop useless JSON-column indexes.
-- Hand-corrected from `prisma migrate diff` to be DATA-PRESERVING and
-- ORPHAN-SAFE (the auto-generated version dropped the difficulty column and
-- would fail ADD CONSTRAINT on any pre-existing orphan rows).

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('Easy', 'Medium', 'Hard');

-- DropIndex (B-tree indexes on serialized JSON-string columns; never usable for containment)
DROP INDEX "Recipe_tags_idx";
DROP INDEX "Recipe_allergyTags_idx";
DROP INDEX "Recipe_dietaryFlags_idx";

-- Recipe.difficulty: String? -> "Difficulty" enum, PRESERVING existing data.
-- Null out any value that isn't a valid enum member so the in-place cast cannot fail
-- (nullable column, so NULL is fine). Enum members equal the historical string values.
UPDATE "Recipe" SET "difficulty" = NULL
WHERE "difficulty" IS NOT NULL AND "difficulty" NOT IN ('Easy', 'Medium', 'Hard');
-- ALTER COLUMN ... TYPE rebuilds the existing "Recipe_difficulty_idx" in place,
-- so it does NOT need to be recreated (unlike the auto-generated drop-and-add version).
ALTER TABLE "Recipe"
  ALTER COLUMN "difficulty" TYPE "Difficulty" USING ("difficulty"::"Difficulty");

-- WeatherCache: single-column unique(date) -> compound unique(date, latitude, longitude).
-- Deduplicate any rows that collide on the new key first (cache rows; pruning is safe).
DELETE FROM "WeatherCache" a
USING "WeatherCache" b
WHERE a.ctid < b.ctid
  AND a."date" = b."date"
  AND a."latitude" = b."latitude"
  AND a."longitude" = b."longitude";
DROP INDEX "WeatherCache_date_key";
CREATE UNIQUE INDEX "WeatherCache_date_latitude_longitude_key"
  ON "WeatherCache"("date", "latitude", "longitude");

-- Foreign keys. Delete rows that reference a non-existent parent BEFORE adding each
-- constraint (such rows are already broken/unreachable and would abort ADD CONSTRAINT).
-- Order matters: User-referencing tables first, then Household(ownerId), then
-- FamilyDigest(householdId), then CookingSession.

DELETE FROM "CsrfToken" t WHERE t."userId" IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM "User" u WHERE u."id" = t."userId");
ALTER TABLE "CsrfToken" ADD CONSTRAINT "CsrfToken_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

DELETE FROM "PasswordHistory" t WHERE t."userId" IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM "User" u WHERE u."id" = t."userId");
ALTER TABLE "PasswordHistory" ADD CONSTRAINT "PasswordHistory_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

DELETE FROM "WebAuthnCredential" t WHERE t."userId" IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM "User" u WHERE u."id" = t."userId");
ALTER TABLE "WebAuthnCredential" ADD CONSTRAINT "WebAuthnCredential_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

DELETE FROM "WebAuthnChallenge" t WHERE t."userId" IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM "User" u WHERE u."id" = t."userId");
ALTER TABLE "WebAuthnChallenge" ADD CONSTRAINT "WebAuthnChallenge_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

DELETE FROM "Household" t WHERE t."ownerId" IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM "User" u WHERE u."id" = t."ownerId");
ALTER TABLE "Household" ADD CONSTRAINT "Household_ownerId_fkey"
  FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

DELETE FROM "FamilyDigest" t WHERE t."householdId" IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM "Household" h WHERE h."id" = t."householdId");
ALTER TABLE "FamilyDigest" ADD CONSTRAINT "FamilyDigest_householdId_fkey"
  FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

DELETE FROM "CookingSession" t WHERE t."userId" IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM "User" u WHERE u."id" = t."userId");
ALTER TABLE "CookingSession" ADD CONSTRAINT "CookingSession_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

DELETE FROM "CookingSession" t WHERE t."recipeId" IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM "Recipe" r WHERE r."id" = t."recipeId");
ALTER TABLE "CookingSession" ADD CONSTRAINT "CookingSession_recipeId_fkey"
  FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;
