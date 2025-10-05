# Phase 3: Advanced Meal Planning Features

## Overview
Phase 3 adds advanced functionality to make the meal planning calendar more powerful and user-friendly.

## Implementation Order

### Phase 3A: Recipe Integration & Meal Management (Priority 1)
**Goal:** Allow users to select recipes when adding meals and edit/delete existing meals

#### 1. Recipe Integration
**Files to Create/Modify:**
- `src/components/calendar/recipe-selector.tsx` - NEW
  - Search/filter interface for user's recipes
  - Display recipe cards with preview
  - Select recipe to add to meal plan
  - Show recipe details (prep time, servings, tags)

- `src/components/calendar/add-meal-dialog.tsx` - MODIFY
  - Add tabs: "Custom Meal" vs "From Recipe"
  - Integrate RecipeSelector component
  - Pre-fill servings from recipe
  - Show recipe image preview when selected

**API Changes:**
- None required (already supports `recipeId` in PlannedMeal)

**Features:**
- Search recipes by name, cuisine, course, tags
- Filter by difficulty, prep time
- Visual recipe cards with images
- One-click add to meal plan
- Adjust servings when adding

#### 2. Edit Meal Functionality
**Files to Modify:**
- `src/components/calendar/add-meal-dialog.tsx` - ENHANCE
  - Support edit mode (pass existing meal data)
  - Pre-populate form fields
  - Change title to "Edit Meal" when editing
  - Update instead of create on submit

- `src/components/calendar/day-view.tsx` - ADD EDIT BUTTON
  - Add edit icon to each meal card
  - Open AddMealDialog in edit mode
  - Pass meal data to dialog

- `src/components/calendar/week-view.tsx` - ADD EDIT BUTTON
  - Add edit icon to meal chips
  - Quick edit inline or modal

- `src/hooks/use-meal-plan.ts` - VERIFY
  - Ensure updateMeal mutation works correctly
  - Add optimistic updates

**Features:**
- Edit meal type, servings, notes
- Switch between recipe/custom meal
- Change recipe selection
- Visual feedback on save

#### 3. Delete Meal Functionality
**Files to Modify:**
- `src/components/calendar/add-meal-dialog.tsx` - ADD DELETE
  - Add delete button (when editing)
  - Confirmation dialog
  - Remove meal on confirm

- `src/components/calendar/day-view.tsx` - ADD DELETE
  - Add delete icon to meal cards
  - Quick delete with confirmation

- `src/components/calendar/week-view.tsx` - ADD DELETE
  - Add delete icon to meal chips
  - Swipe to delete on mobile (optional)

- `src/hooks/use-meal-plan.ts` - VERIFY
  - Ensure deleteMeal mutation works
  - Remove from cache on delete

**Features:**
- One-click delete with confirmation
- Toast notification on success
- Optimistic UI updates

---

### Phase 3B: Shopping List Generation (Priority 2)
**Goal:** Auto-generate shopping lists from meal plans

#### 1. Shopping List Generator
**Files to Create:**
- `src/lib/shopping-list-generator.ts` - NEW
  - Parse ingredients from all meals in date range
  - Combine duplicate ingredients
  - Group by category (produce, dairy, meat, pantry, etc.)
  - Scale quantities based on servings
  - Handle unit conversions (cups, tbsp, etc.)

**Logic:**
```typescript
interface ShoppingListItem {
  ingredient: string;
  quantity: string;
  unit: string;
  category: string;
  recipeIds: string[];
  isChecked: boolean;
}

function generateShoppingList(meals: PlannedMeal[]): ShoppingListItem[] {
  // 1. Extract all ingredients from recipes
  // 2. Combine duplicates (2 cups + 1 cup = 3 cups)
  // 3. Categorize by ingredient type
  // 4. Sort by category
}
```

#### 2. Shopping List UI
**Files to Create:**
- `src/components/shopping-list-view.tsx` - NEW
  - Display grouped shopping list
  - Checkbox to mark items purchased
  - Edit quantities/items
  - Add custom items
  - Print/export functionality
  - Clear completed items

- `src/app/api/shopping-lists/route.ts` - NEW
  - POST /api/shopping-lists - Generate from meal plan
  - GET /api/shopping-lists - List user's shopping lists
  - PUT /api/shopping-lists/[id] - Update items/checked state
  - DELETE /api/shopping-lists/[id] - Delete shopping list

**Files to Modify:**
- `src/components/meal-planning-calendar.tsx` - ADD BUTTON
  - "Generate Shopping List" button in header
  - Date range selector (default: current meal plan dates)
  - Modal showing generated list

**Features:**
- Auto-categorized ingredients
- Smart quantity combining
- Check off items as purchased
- Save multiple shopping lists
- Export to PDF or text
- Share shopping list (optional)

---

### Phase 3C: Weather-Based Meal Suggestions (Priority 3)
**Goal:** Suggest meals based on weather forecast

#### 1. Meal Recommendation Engine
**Files to Create:**
- `src/lib/weather-meal-matcher.ts` - NEW
  - Algorithm to match recipes with weather
  - Temperature ranges → meal types
  - Weather conditions → cooking methods
  - Seasonal ingredients

**Matching Logic:**
```typescript
Weather Conditions → Recipe Suggestions
- Hot (>80°F) → Cold/Light meals (salads, gazpacho, smoothies)
- Warm (70-80°F) → Grilled, fresh meals
- Cool (50-70°F) → Comfort food, soups, roasted dishes
- Cold (<50°F) → Hearty stews, hot dishes, baked goods
- Rainy → Comfort food, soups, slow-cooker meals
- Sunny → Outdoor grilling, fresh salads
```

**Scoring System:**
- Temperature match: 40 points
- Weather condition match: 30 points
- Seasonal ingredients: 20 points
- User preferences: 10 points

#### 2. Suggestion UI
**Files to Create:**
- `src/components/calendar/weather-suggestions.tsx` - NEW
  - Display 3-5 suggested recipes per day
  - Weather icon + temperature
  - Recipe cards with "Add to Plan" button
  - Reasoning: "Perfect for cold weather"

**Files to Modify:**
- `src/components/calendar/add-meal-dialog.tsx` - ADD TAB
  - Add "Suggested" tab
  - Show WeatherSuggestions component
  - Quick add from suggestions

- `src/components/calendar/day-view.tsx` - ADD SECTION
  - "Suggested for today" section
  - Show 3 suggested recipes below planned meals

**Features:**
- Daily personalized suggestions
- Weather-aware recommendations
- One-click add to plan
- Refresh suggestions button
- Learn from user selections (future enhancement)

---

### Phase 3D: Meal Templates (Priority 4)
**Goal:** Save and reuse common meal patterns

#### 1. Template Creation
**Files to Create:**
- `src/components/calendar/save-template-dialog.tsx` - NEW
  - Select days to include in template
  - Name template (e.g., "Typical Work Week")
  - Save all meals from selected days
  - Preview before saving

- `src/app/api/templates/route.ts` - NEW
  - POST /api/templates - Create template
  - GET /api/templates - List user's templates
  - DELETE /api/templates/[id] - Delete template

**Template Structure:**
```typescript
interface MealTemplate {
  id: string;
  name: string;
  meals: {
    dayOffset: number; // 0 = Monday, 1 = Tuesday, etc.
    mealType: MealType;
    recipeId?: string;
    customMealName?: string;
    servings: number;
  }[];
}
```

#### 2. Template Application
**Files to Create:**
- `src/components/calendar/apply-template-dialog.tsx` - NEW
  - Browse saved templates
  - Preview template meals
  - Select start date to apply
  - Option to overwrite existing meals or skip conflicts

**Files to Modify:**
- `src/components/meal-planning-calendar.tsx` - ADD BUTTON
  - "Apply Template" button in header
  - Open template selection dialog

**Features:**
- Save common weekly patterns
- Quick apply to any week
- Template preview before applying
- Manage templates (rename, delete)
- Share templates (future enhancement)

---

### Phase 3E: Drag & Drop (Priority 5)
**Goal:** Reschedule meals by dragging between days/times

#### 1. Drag & Drop Implementation
**Libraries:**
- Install `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`
- Accessible drag and drop for React

**Files to Modify:**
- `src/components/calendar/month-view.tsx` - ADD DND
  - Make meal items draggable
  - Make day cells droppable
  - Update meal date on drop

- `src/components/calendar/week-view.tsx` - ADD DND
  - Drag meals between days and meal types
  - Visual feedback during drag
  - Snap to grid

- `src/components/calendar/day-view.tsx` - ADD DND
  - Reorder meals within same day
  - Drag to change meal type

**Features:**
- Smooth drag animations
- Visual drop targets
- Keyboard accessible (Arrow keys + Space)
- Touch support for mobile
- Undo recent move (optional)

---

## Implementation Timeline

### Week 1: Phase 3A (Core Functionality)
- Day 1-2: Recipe selector component
- Day 3-4: Edit meal functionality
- Day 5: Delete meal functionality
- Day 6-7: Testing & refinement

### Week 2: Phase 3B (Shopping Lists)
- Day 1-3: Shopping list generator logic
- Day 4-5: Shopping list UI
- Day 6-7: API routes & testing

### Week 3: Phase 3C & 3D
- Day 1-3: Weather-based suggestions
- Day 4-5: Meal templates
- Day 6-7: Integration & testing

### Week 4: Phase 3E (Polish)
- Day 1-4: Drag & drop implementation
- Day 5-7: Final testing, bug fixes, documentation

## Success Criteria

- [ ] Users can select recipes when adding meals
- [ ] Users can edit any planned meal
- [ ] Users can delete meals with confirmation
- [ ] Shopping lists auto-generate from meal plans
- [ ] Weather suggestions appear based on forecast
- [ ] Users can save and apply meal templates
- [ ] Drag & drop works across all views
- [ ] Mobile-friendly on all features
- [ ] No performance degradation

## Technical Considerations

### Performance
- Lazy load recipe images
- Virtualize long recipe lists
- Debounce search inputs
- Cache weather suggestions

### UX
- Loading states for all async operations
- Optimistic updates for instant feedback
- Clear error messages
- Confirmation for destructive actions
- Keyboard shortcuts for power users

### Accessibility
- ARIA labels on all interactive elements
- Keyboard navigation support
- Screen reader announcements
- Focus management in dialogs
- High contrast mode support

---

**Ready to begin Phase 3A?**
