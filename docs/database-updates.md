# Database Schema Updates

## Summary
Added new fields to the Recipe model and created a new Plan model for meal planning functionality.

## New Recipe Fields Added
- `slug` (String, unique) - URL-friendly version of recipe title
- `audioUrl` (String, optional) - URL for audio instructions/notes
- `originName` (String, optional) - Name of place/region of origin (e.g., "Sicily, Italy")
- `originLat` (Float, optional) - Latitude of origin location
- `originLng` (Float, optional) - Longitude of origin location  
- `parentId` (String, optional) - Reference to parent recipe for recipe variations

## New Plan Model
For meal planning functionality:
- `id` - Unique identifier
- `recipeId` - Reference to Recipe
- `userId` - Reference to User
- `plannedFor` - Date when meal is planned
- `createdAt` - Creation timestamp
- `updatedAt` - Last update timestamp

### Unique Constraint
Plans have a unique constraint on `(recipeId, plannedFor, userId)` to prevent duplicate plans for the same recipe on the same date by the same user.

## Recipe Variations
Recipes can now reference parent recipes via `parentId`, enabling:
- Recipe variations (e.g., "Grandma's Lasagna" → "Vegetarian Lasagna")
- Recipe improvements/modifications
- Family recipe lineage tracking

## Migration
- Created migration: `20250919065500_init`
- Database reset and reseeded with new schema
- All existing recipes automatically get slugs generated from titles

## Slug Generation
Slugs are automatically generated from recipe titles:
- Converts to lowercase
- Removes special characters
- Replaces spaces with hyphens
- Ensures uniqueness

Examples:
- "Grandma's Classic Lasagna" → "grandmas-classic-lasagna"
- "Fluffy Buttermilk Pancakes" → "fluffy-buttermilk-pancakes"

## Available Scripts
- `npm run db:reset` - Reset database and run migrations
- `npm run db:seed` - Seed database with sample data
- `npm run db:studio` - Open Prisma Studio
- `npm run backfill:slugs` - Backfill script for slug generation (for future use)

## Testing
- ✅ All migrations applied successfully
- ✅ Seed data includes new fields with sample geographic data
- ✅ Plan model tested with meal planning example
- ✅ Slug generation working correctly
- ✅ TypeScript types updated

## Files Modified
- `prisma/schema.prisma` - Added new fields and Plan model
- `prisma/seed.ts` - Updated with new fields and slug generation
- `src/lib/types.ts` - Updated TypeScript types
- `scripts/backfill-slugs.ts` - Slug backfill utility
- `scripts/test-*.js` - Testing scripts for verification

## Sample Data
The seed now includes:
- Geographic origin data (Sicily for lasagna, New England for pancakes)
- Properly generated slugs
- Sample meal plan for Christmas dinner

This provides a solid foundation for enhanced recipe management, meal planning, and geographic/cultural context tracking.