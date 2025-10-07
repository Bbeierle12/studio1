# Nutrition Tracking - Quick Start Guide

**Phase 4A Status:** ✅ Complete (pending database migration)

---

## 🚀 Getting Started

### Step 1: Run Database Migration ⚠️ REQUIRED

Before using nutrition tracking, you **must** run the database migration:

```bash
# Make sure DATABASE_URL is set in .env.local
npx prisma migrate dev --name add_nutrition_tracking

# Regenerate Prisma Client
npx prisma generate
```

This adds:
- 8 nutrition fields to Recipe table (calories, protein, carbs, fat, fiber, sugar, sodium, servingSize)
- NutritionGoal table for user goals

### Step 2: Build and Test

```bash
# Build the application
npm run build

# Start development server
npm run dev
```

The build will succeed (✅ confirmed) but will show a database error until you run the migration.

---

## 📱 Using Nutrition Tracking

### Setting Your First Goal

1. Log in to your account
2. Navigate to the meal plan calendar
3. Open the Nutrition Panel (button on the right side)
4. Click "Set Goals"
5. Choose a preset:
   - **Weight Loss**: 1,800 kcal/day (30% protein, 40% carbs, 30% fat)
   - **Maintenance**: 2,000 kcal/day (20% protein, 50% carbs, 30% fat)
   - **Muscle Gain**: 2,500 kcal/day (30% protein, 50% carbs, 20% fat)
6. Or enter custom values
7. Click "Create Goal"

### Adding Nutrition to Recipes

**Option 1: While Creating a Recipe**
1. Go to "Create Recipe"
2. Fill in basic recipe info
3. Scroll to "Nutrition Information (Optional)" section
4. Enter nutrition per serving:
   - Serving Size (e.g., "1 cup", "2 pieces")
   - Calories
   - Protein (g)
   - Carbs (g)
   - Fat (g)
   - Fiber (g) [optional]
   - Sugar (g) [optional]
   - Sodium (mg) [optional]
5. Save recipe

**Option 2: Updating Existing Recipe**
1. Open the recipe
2. Click "Edit"
3. Add nutrition information
4. Save

**Option 3: Using the API**
```javascript
fetch('/api/recipes/RECIPE_ID/nutrition', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    servingSize: '1 cup',
    calories: 350,
    protein: 25,
    carbs: 40,
    fat: 10,
    fiber: 5,
    sugar: 8,
    sodium: 450
  })
})
```

### Tracking Your Daily Nutrition

1. Plan your meals in the calendar (add recipes to breakfast, lunch, dinner, snacks)
2. Open Nutrition Panel for the selected date
3. View:
   - **Daily Tab**: Total calories and macros with progress bars
   - **Weekly Tab**: 7-day averages and totals
   - **Breakdown Tab**: Nutrition by meal type

---

## 🎨 Visual Indicators

### Progress Bar Colors

- **Green (80-120%)**: You're on track! ✅
- **Yellow (<80%)**: Below target ⚠️
- **Red (>120%)**: Over target ⛔

### Nutrition Badge

Recipes with nutrition data show a badge:
- **Compact**: Just calories (Flame icon + kcal)
- **Default**: Calories + P/C/F macros
- **Detailed**: Separate badges for each nutrient

---

## 🔧 Technical Details

### Files Created

**Backend:**
- [src/app/api/nutrition/goals/route.ts](src/app/api/nutrition/goals/route.ts)
- [src/app/api/nutrition/summary/route.ts](src/app/api/nutrition/summary/route.ts)
- [src/app/api/nutrition/weekly-summary/route.ts](src/app/api/nutrition/weekly-summary/route.ts)
- [src/app/api/recipes/[id]/nutrition/route.ts](src/app/api/recipes/[id]/nutrition/route.ts)
- [src/lib/nutrition-calculator.ts](src/lib/nutrition-calculator.ts)

**Frontend:**
- [src/components/nutrition/nutrition-badge.tsx](src/components/nutrition/nutrition-badge.tsx)
- [src/components/nutrition/goals-dialog.tsx](src/components/nutrition/goals-dialog.tsx)
- [src/components/nutrition/daily-summary.tsx](src/components/nutrition/daily-summary.tsx)
- [src/components/nutrition/nutrition-panel.tsx](src/components/nutrition/nutrition-panel.tsx)
- [src/hooks/use-nutrition.ts](src/hooks/use-nutrition.ts)

**Database:**
- [prisma/schema.prisma](prisma/schema.prisma) - Updated Recipe model, added NutritionGoal model

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/nutrition/goals` | GET | List user's goals |
| `/api/nutrition/goals` | POST | Create new goal |
| `/api/nutrition/goals` | PATCH | Update goal |
| `/api/nutrition/goals?id=X` | DELETE | Delete goal |
| `/api/nutrition/summary?date=YYYY-MM-DD` | GET | Daily summary |
| `/api/nutrition/weekly-summary?startDate=YYYY-MM-DD` | GET | Weekly summary |
| `/api/recipes/[id]/nutrition` | GET | Get recipe nutrition |
| `/api/recipes/[id]/nutrition` | PATCH | Update recipe nutrition |

---

## 🧪 Testing Checklist

- [ ] Database migration runs successfully
- [ ] Can create a nutrition goal
- [ ] Can edit a nutrition goal
- [ ] Can delete a nutrition goal
- [ ] Can add nutrition to a recipe
- [ ] Nutrition badge appears on recipe cards
- [ ] Daily summary shows correct totals
- [ ] Progress bars display correctly
- [ ] Color coding works (green/yellow/red)
- [ ] Weekly summary calculates correctly
- [ ] Breakdown by meal type works
- [ ] Servings multiply correctly (2 servings = 2x nutrition)

---

## ❓ FAQ

**Q: Do I have to add nutrition to every recipe?**
A: No! Nutrition is completely optional. Only recipes with nutrition data will contribute to your daily totals.

**Q: Where do I get nutrition data?**
A: Copy from food labels, use USDA FoodData Central, or estimate based on ingredients. Future versions will include automatic estimation.

**Q: Can I track micronutrients (vitamins, minerals)?**
A: Not yet. Phase 4A focuses on macros. Micronutrient tracking is planned for a future update.

**Q: How does servings scaling work?**
A: Nutrition is stored per serving. When you add a meal with 2 servings, the displayed nutrition automatically doubles. Daily totals reflect the actual servings eaten.

**Q: Can I have multiple goals?**
A: Yes, but only one can be active at a time. Create multiple goals (e.g., "Cutting", "Bulking") and switch between them as needed.

---

## 🐛 Troubleshooting

### Build Error: "Column Recipe.servingSize does not exist"

**Cause:** Database migration hasn't been run yet

**Solution:** Run migration:
```bash
npx prisma migrate dev --name add_nutrition_tracking
```

### API Error: "Failed to fetch nutrition goals"

**Cause:** User not logged in or session expired

**Solution:** Log in again

### Nutrition summary shows 0 for everything

**Cause:** No meals planned for that date, or recipes don't have nutrition data

**Solution:**
1. Add meals to the meal plan
2. Add nutrition data to those recipes
3. Refresh the nutrition panel

---

## 📚 Full Documentation

- **Phase 4A Complete Guide**: [docs/PHASE-4A-NUTRITION-TRACKING.md](docs/PHASE-4A-NUTRITION-TRACKING.md)
- **Phase 4C PWA Guide**: [docs/PHASE-4B-PWA-COMPLETE.md](docs/PHASE-4B-PWA-COMPLETE.md)
- **Combined Summary**: [PHASE-4A-4C-COMPLETE.md](PHASE-4A-4C-COMPLETE.md)

---

## 🎉 You're Ready!

Nutrition tracking is fully implemented and ready to use. After running the database migration, you can:

✅ Set personalized nutrition goals
✅ Track calories and macros automatically
✅ Monitor daily and weekly progress
✅ See nutrition breakdowns by meal type
✅ Achieve your health and fitness goals

**Happy tracking! 🍎📊**
