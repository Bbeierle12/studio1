-- WeatherCache was keyed on `date` alone, which made it a single global cache shared by
-- every user: the first person to open the calendar cached their own city's forecast and
-- served it to everyone else. Re-key on (dateKey, latitude, longitude).
--
-- `date` (DateTime) is replaced by `dateKey` (YYYY-MM-DD in the *location's* local
-- calendar) because a DateTime round-trips through JSON as an instant and lands on the
-- wrong day for clients whose timezone differs from the server's.
--
-- The table is empty (0 rows, verified), so this is a clean replace rather than a backfill.

DROP INDEX IF EXISTS "WeatherCache_date_key";
DROP INDEX IF EXISTS "WeatherCache_date_idx";

ALTER TABLE "WeatherCache" DROP COLUMN IF EXISTS "date";
ALTER TABLE "WeatherCache" ADD COLUMN "dateKey" TEXT NOT NULL;

CREATE INDEX "WeatherCache_dateKey_idx" ON "WeatherCache"("dateKey");
CREATE UNIQUE INDEX "WeatherCache_dateKey_latitude_longitude_key"
  ON "WeatherCache"("dateKey", "latitude", "longitude");
