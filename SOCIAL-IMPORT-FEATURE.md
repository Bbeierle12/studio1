# Social Media Recipe Import

Share a recipe from Instagram, TikTok, or any website into the app via the
native OS share sheet, and it is parsed and saved automatically.

## How it works

1. **Share target (`public/manifest.json`)** — declares `share_target` pointing at
   `/recipes/import` (GET, with `title`/`text`/`url` params). Android reads this
   from the installed PWA to list the app in the system share sheet.
2. **`AutoImporter` (`src/components/recipe-import/auto-importer.tsx`)** — reads the
   share params and picks a path via `extractShareTarget` (`src/lib/share-import.ts`),
   which handles a bare `url`, a URL inside `text` (Android), a URL embedded in a
   caption, or caption-only text.
3. **Two backends:**
   - **URL** → `POST /api/recipes/import` → `importRecipeFromUrl`
     (`src/lib/recipe-importer.ts`): SSRF-guarded fetch, extracts the page's
     **JSON-LD Recipe block** when present (else tag-stripped text), then Gemini
     structured output.
   - **Caption text** → `POST /api/recipe-import/ai` → `parseRecipeFromText`
     (`src/lib/ai-import.ts`): Gemini structured output directly.
4. **Save** — `addRecipeAction` persists the recipe; the user lands on `/recipes`.

## Configuration

- `GOOGLE_GENERATIVE_AI_API_KEY` — required. Set in `.env.local` and all three
  Vercel environments.
- `GEMINI_MODEL` — optional override (default `gemini-3.5-flash`).

## Known limitations

- **Some publishers block server-side fetches.** AllRecipes, Serious Eats, and
  Simply Recipes (Dotdash Meredith) return **403 to any datacenter IP**,
  regardless of request headers. The importer detects this and tells the user to
  share the recipe *text* instead of the link, which works. This is not a bug to
  fix with header spoofing.
- The share target only appears once the PWA is **installed** — Android needs a
  valid 192px/512px icon and a publicly-fetchable manifest for that (see
  `public/icons/README.md`).

## Testing

- `tests/share-import.test.ts` — share-param triage and the two backends'
  differing recipe shapes (the client↔API contract).
- `tests/recipe-importer.test.ts` — JSON-LD extraction, SSRF rejection, fetch failures.
- `tests/ai-import.test.ts` — caption → structured recipe, defaults, error wrapping.
- `tests/safe-fetch.test.ts` — private-range matrix, redirect re-validation.

Verified live against real recipe URLs and a real social-style caption.
Remaining acceptance gate: on-device share from the phone's share sheet.
