# Recipe Hub - Phase 3 Feature #1: Favorites API

**Status**: 🚀 IN PROGRESS  
**Started**: October 9, 2025  
**Effort**: 2-3 hours

---

## 📋 Implementation Steps

### Step 1: Database Schema ✅ COMPLETE
**Task**: Add favorites table to database  
**Status**: DONE

We need to add a `FavoriteRecipe` model to track user favorites:

```prisma
model FavoriteRecipe {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation("UserFavorites", fields: [userId], references: [id], onDelete: Cascade)
  recipeId  String
  recipe    Recipe   @relation("RecipeFavorites", fields: [recipeId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())

  @@unique([userId, recipeId])
  @@index([userId])
  @@index([recipeId])
}
```

Also need to add relations to User and Recipe models:
- User: `favorites FavoriteRecipe[] @relation("UserFavorites")`
- Recipe: `favorites FavoriteRecipe[] @relation("RecipeFavorites")`

### Step 2: API Routes ✅ COMPLETE
**Status**: DONE

Create the following API endpoints:

#### `/api/recipes/favorites/route.ts` - GET
- Fetch all favorited recipes for current user
- Returns array of Recipe objects
- Requires authentication

#### `/api/recipes/[id]/favorite/route.ts` - POST
- Toggle favorite status for a recipe
- Returns `{ favorited: boolean }`
- Requires authentication

### Step 3: Frontend Integration ⏳
**Status**: After API

The frontend is already set up in:
- `src/lib/recipe-api.ts` - API client functions
- `src/components/recipes/recipe-detail-drawer.tsx` - Favorite button

Just need to verify it works with real API!

### Step 4: Testing ⏳
**Status**: Final step

Test:
- [ ] Add favorite works
- [ ] Remove favorite works
- [ ] Favorites persist across sessions
- [ ] Favorites tab shows correct recipes
- [ ] Optimistic updates work
- [ ] Error handling works

---

## 🚀 Let's Begin!

Starting with database schema update...
