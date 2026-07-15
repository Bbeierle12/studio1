-- Remove the per-user OpenAI API key feature.
-- The app is Gemini-only and runs on a single system key; this column stored
-- AES-encrypted OpenAI keys that are no longer read by any code path.
ALTER TABLE "User" DROP COLUMN IF EXISTS "openaiApiKey";
