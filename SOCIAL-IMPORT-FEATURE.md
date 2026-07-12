# Social Media Recipe Import Integration

## Overview
This feature allows users to seamlessly import recipes from social media (like Instagram or TikTok) or websites directly into the Studio1 app using the native OS Share functionality (via the Web Share Target API). 

## Implementation Details

1. **Web Share Target Integration (`manifest.json`)**:
   - The app's PWA manifest already contained a `share_target` pointing to `/recipes/import`. This allows the native mobile OS to pass the `url`, `title`, and `text` directly to the app when the user taps "Share" on their phone.

2. **Backend API (`/api/recipes/import`)**:
   - Created a new POST route at `/src/app/api/recipes/import/route.ts`.
   - Uses a new utility `importRecipeFromUrl` (`src/lib/recipe-importer.ts`) that accepts a URL, fetches the raw HTML content, and uses `@ai-sdk/openai` to extract unstructured data into a structured recipe object.

3. **Frontend Auto-Importer (`src/components/recipe-import/auto-importer.tsx`)**:
   - Integrated a Client Component that intercepts the `searchParams` loaded via the Share Target.
   - Immediately detects the presence of a `url` or `text` (if Android puts the URL in the text field).
   - Shows a full-screen loading overlay while hitting the backend API.
   - Uses the existing `addRecipeAction` to automatically persist the extracted recipe into the database and catalog.
   - Redirects to `/recipes` upon successful save.

## Testing
- Automated unit tests were added in `tests/recipe-importer.test.ts` to ensure the importer correctly handles valid URLs, invalid URLs, and fetching errors.
- Tests pass (`vitest`) and codebase strictly conforms to type checks (`tsc --noEmit`).

## Next Steps
- Enable any further visual polish for the auto-import loading state.
- Test directly on a mobile device (iOS/Android) via the native share sheet.
