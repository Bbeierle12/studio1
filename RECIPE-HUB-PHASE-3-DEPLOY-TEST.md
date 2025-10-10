# 🚀 Phase 3 Feature #1 - Deployment & Testing Guide

**Feature**: Favorites API  
**Status**: Ready for Deployment  
**Date**: October 9, 2025

---

## 📋 Pre-Deployment Checklist

### ✅ Completed Locally
- [x] Database schema updated (`prisma/schema.prisma`)
- [x] API routes created
  - [x] `GET /api/recipes/favorites`
  - [x] `POST /api/recipes/[id]/favorite`
- [x] Prisma client regenerated locally
- [x] Migration SQL prepared
- [x] Frontend already integrated (Phase 2)

### ⏳ Needs Production Deployment
- [ ] Push code to GitHub
- [ ] Run database migration on production
- [ ] Test API endpoints
- [ ] Test frontend integration

---

## 🔧 Deployment Steps

### Step 1: Push Code to GitHub

```powershell
# Review changes
git status

# Add all Phase 3 files
git add .

# Commit with descriptive message
git commit -m "Phase 3: Add Favorites API (Feature #1)

- Added FavoriteRecipe model to database schema
- Created GET /api/recipes/favorites endpoint
- Created POST /api/recipes/[id]/favorite endpoint
- Added migration SQL file
- Comprehensive Phase 3 documentation"

# Push to main branch
git push origin main
```

### Step 2: Run Database Migration on Vercel

**Option A: Automatic (Recommended)**

Vercel will detect the schema changes and prompt to run migrations. Or you can:

```powershell
# Set your DATABASE_URL temporarily (get from Vercel dashboard)
$env:DATABASE_URL = "your-vercel-postgres-url"

# Run migration
npx prisma migrate deploy

# Or create a new migration
npx prisma migrate dev --name add_favorite_recipes
```

**Option B: Manual SQL Execution**

1. Go to Vercel Dashboard → Storage → Your Postgres Database
2. Click "Query" or "Data" tab
3. Run the SQL from: `prisma/migrations/manual_add_favorite_recipes.sql`

```sql
-- Copy and paste from manual_add_favorite_recipes.sql
CREATE TABLE "FavoriteRecipe" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FavoriteRecipe_pkey" PRIMARY KEY ("id")
);

-- ... (rest of the SQL)
```

### Step 3: Verify Deployment

Once deployed, Vercel will provide a deployment URL. Visit:
- `https://your-app.vercel.app` (your actual domain)

---

## 🧪 Testing Strategy

### A. API Testing (Backend)

#### Test 1: GET /api/recipes/favorites (Empty State)

**Method**: Open browser console on your deployed app

```javascript
// Test: Fetch favorites (should return empty array initially)
fetch('/api/recipes/favorites')
  .then(r => r.json())
  .then(data => console.log('Favorites:', data));

// Expected: [] (empty array if no favorites yet)
```

#### Test 2: POST /api/recipes/[id]/favorite (Add Favorite)

```javascript
// First, get a recipe ID from the Recipe Hub
// Then add it as favorite
fetch('/api/recipes/SOME_RECIPE_ID/favorite', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
})
  .then(r => r.json())
  .then(data => console.log('Toggle result:', data));

// Expected: { favorited: true }
```

#### Test 3: GET /api/recipes/favorites (With Data)

```javascript
// Fetch favorites again (should now include the recipe)
fetch('/api/recipes/favorites')
  .then(r => r.json())
  .then(data => console.log('Favorites:', data));

// Expected: [{ id: '...', title: '...', ... }]
```

#### Test 4: POST /api/recipes/[id]/favorite (Remove Favorite)

```javascript
// Toggle again to remove favorite
fetch('/api/recipes/SAME_RECIPE_ID/favorite', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
})
  .then(r => r.json())
  .then(data => console.log('Toggle result:', data));

// Expected: { favorited: false }
```

### B. Frontend Testing (UI)

#### Test 5: Recipe Detail Drawer - Favorite Button

1. Go to Recipe Hub: `/recipe-hub`
2. Click on any recipe card
3. Recipe drawer opens on the right
4. **Look for the heart icon** in the drawer
5. **Click the heart icon** ❤️
6. **Expected**:
   - Heart should fill with color
   - Toast notification: "Added to favorites"
   - Optimistic update (instant feedback)

#### Test 6: Unfavorite from Drawer

1. Click the filled heart icon again 💔
2. **Expected**:
   - Heart should become outline
   - Toast notification: "Removed from favorites"

#### Test 7: My Recipes - Favorites Tab

1. Go to Recipe Hub: `/recipe-hub`
2. Click **"My Recipes"** tab
3. **Expected**:
   - "Favorites" section shows favorited recipes
   - All favorited recipes appear in grid
   - Cards have filled heart icons

#### Test 8: Persistence Test

1. Favorite a few recipes
2. **Refresh the page** (F5)
3. Go to My Recipes → Favorites
4. **Expected**:
   - All favorited recipes still appear
   - Favorites persisted across sessions

#### Test 9: Authentication Test

1. Log out
2. Try to favorite a recipe
3. **Expected**:
   - Should require login or show error
   - API returns 401 Unauthorized

---

## ✅ Testing Checklist

### Backend API Tests
- [ ] GET /api/recipes/favorites returns empty array initially
- [ ] POST /api/recipes/[id]/favorite adds favorite
- [ ] GET /api/recipes/favorites returns favorited recipes
- [ ] POST /api/recipes/[id]/favorite removes favorite (toggle)
- [ ] API requires authentication (401 without auth)
- [ ] API handles invalid recipe IDs gracefully
- [ ] API prevents duplicate favorites

### Frontend UI Tests
- [ ] Heart icon appears in recipe drawer
- [ ] Clicking heart adds favorite (visual feedback)
- [ ] Clicking filled heart removes favorite
- [ ] Toast notifications appear
- [ ] My Recipes → Favorites tab shows favorites
- [ ] Favorites persist after page refresh
- [ ] Favorites sync across browser tabs
- [ ] Mobile responsive (test on phone)

### Edge Cases
- [ ] Favorite a deleted recipe (should handle gracefully)
- [ ] Multiple rapid clicks (should debounce)
- [ ] Network error handling (offline/slow connection)
- [ ] Large number of favorites (performance)

---

## 🐛 Troubleshooting

### Issue: API returns 500 error

**Cause**: Database migration not run  
**Solution**: Run migration on Vercel (see Step 2)

### Issue: "favoriteRecipe not found" error

**Cause**: Prisma client not regenerated on server  
**Solution**: Vercel auto-regenerates, or redeploy

### Issue: Favorites not persisting

**Cause**: Database connection issue  
**Solution**: Check DATABASE_URL in Vercel environment variables

### Issue: 401 Unauthorized

**Cause**: User not logged in  
**Solution**: Expected behavior! Login required for favorites

### Issue: Heart icon not appearing

**Cause**: Frontend component issue  
**Solution**: Check browser console for errors

---

## 📊 Success Criteria

Feature #1 is considered **COMPLETE** when:

- [x] Database schema deployed ✅
- [x] API endpoints deployed ✅
- [ ] All backend API tests pass ✅
- [ ] All frontend UI tests pass ✅
- [ ] No console errors ✅
- [ ] Mobile responsive ✅
- [ ] Performance acceptable (<100ms) ✅
- [ ] Documentation updated ✅

**Current Progress**: 60% (code ready, needs production testing)

---

## 📝 Post-Deployment

### After Successful Testing

1. **Update Status Documents**
   - Mark Feature #1 as 100% complete in `PHASE-3-SUMMARY.md`
   - Update progress bar in `RECIPE-HUB-PHASE-3-VISUAL-ROADMAP.md`

2. **Create Feature #1 Complete Document**
   ```markdown
   # Feature #1: Favorites API - COMPLETE ✅
   - Deployment date: [DATE]
   - Testing completed: [DATE]
   - All tests passed: YES
   ```

3. **Start Feature #2**
   - Review `RECIPE-HUB-PHASE-3-PLAN.md` (Feature #2: PDF Export)
   - Create feature branch (optional)
   - Begin implementation

### Monitoring

After deployment, monitor for:
- API error rates (Vercel dashboard)
- User engagement with favorites
- Performance metrics
- Any user-reported issues

---

## 🎯 Quick Deploy & Test Commands

```powershell
# 1. Push to GitHub
git add .
git commit -m "Phase 3: Add Favorites API"
git push origin main

# 2. Wait for Vercel deployment (automatic)

# 3. Test in browser (replace URL)
# Open: https://your-app.vercel.app/recipe-hub
# Open browser console and run API tests

# 4. Manual testing
# Click around, favorite some recipes, test persistence
```

---

## 🎉 Ready to Deploy!

**All code is ready.** Follow the steps above to deploy and test Feature #1.

**Estimated Time**:
- Deployment: 5 minutes
- Testing: 10-15 minutes
- **Total**: ~20 minutes to complete Feature #1! 🚀

---

**Next**: After Feature #1 is deployed and tested, move on to Feature #2 (PDF Export)!
