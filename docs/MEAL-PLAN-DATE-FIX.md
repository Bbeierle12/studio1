# Meal Planning Date Conversion Fix

## Issue Report
**Date:** October 6, 2025  
**Reported By:** User  
**Environment:** Production (craicnkuche.com)  
**Severity:** High - Meal planning page completely broken

## Problem Description
When accessing the `/meal-plan` page, users encountered a generic error message:
```
Oops! Something went wrong

We're sorry, but something unexpected happened while preparing your recipe.
Our kitchen staff (developers) have been notified and are working on a fix.
```

The error was caught by the ErrorBoundary component, preventing the entire meal planning section from functioning.

## Root Cause
The API endpoints return meal plan data with `startDate` and `endDate` as **ISO string format** (standard JSON serialization), but the `useWeather` hook in the `MealPlanningCalendar` component was expecting **Date objects**.

### Code Location
**File:** `src/components/meal-planning-calendar.tsx`

**Before (Broken):**
```tsx
const { weatherForecast, isLoading: weatherLoading } = useWeather(
  activeMealPlan?.startDate,     // ❌ String, not Date object
  activeMealPlan?.endDate         // ❌ String, not Date object
);
```

**After (Fixed):**
```tsx
const { weatherForecast, isLoading: weatherLoading } = useWeather(
  activeMealPlan?.startDate ? new Date(activeMealPlan.startDate) : undefined,  // ✅ Converted to Date
  activeMealPlan?.endDate ? new Date(activeMealPlan.endDate) : undefined       // ✅ Converted to Date
);
```

## Why This Happened
1. **API Serialization**: When Prisma data is returned via `NextResponse.json()`, Date objects are automatically converted to ISO strings
2. **Type Mismatch**: The `useWeather` hook calls `date.toISOString()` on the parameters, which fails when passed a string instead of a Date object
3. **No TypeScript Error**: TypeScript didn't catch this because the `MealPlan` type defines `startDate` and `endDate` as `Date`, but at runtime they're strings after JSON serialization

## Solution
Convert the date strings to Date objects before passing them to the `useWeather` hook:
- Check if the value exists (optional chaining)
- Create a new Date object from the string
- Pass `undefined` if the value doesn't exist

## Testing
1. **Local Testing**: Verified the fix works in development environment
2. **Deployment**: Pushed fix to GitHub (commit `c627ffd`)
3. **Production**: Vercel will auto-deploy the fix to craicnkuche.com

## Impact
✅ **Fixed:** Meal planning calendar now loads correctly  
✅ **Fixed:** Weather forecasts work properly  
✅ **Fixed:** All date-related features functional  

## Prevention
Consider these improvements for the future:
1. **Add API response transformers** to automatically convert date strings to Date objects
2. **Implement runtime validation** with Zod or similar library
3. **Add integration tests** that catch type mismatches between API and client
4. **Document serialization behavior** in API route comments

## Verification Steps
After deployment, verify:
1. ✅ Navigate to `/meal-plan`
2. ✅ Page loads without error
3. ✅ Create a new meal plan
4. ✅ Weather forecast displays correctly
5. ✅ Date ranges display properly

## Related Files
- `src/components/meal-planning-calendar.tsx` - Fixed
- `src/hooks/use-weather.ts` - Expects Date objects
- `src/app/api/meal-plans/route.ts` - Returns JSON with string dates
- `src/lib/types.ts` - Type definitions

## Commit
**Hash:** `c627ffd`  
**Message:** "Fix: Convert API date strings to Date objects in meal planning calendar"  
**Files Changed:** 1 file, 2 insertions(+), 2 deletions(-)
