# 🧪 Manual Testing Checklist

## Quick Test Guide
**URL:** http://localhost:9002/meal-plan
**Status:** Dev server running ✅

---

## ✅ Tests You Can Do Right Now

### Test 1: Basic Setup (5 min)
- [ ] Navigate to http://localhost:9002
- [ ] Log in with your credentials
- [ ] Click "Calendar" in the header
- [ ] You should see the meal planning calendar

**Expected:** Calendar loads without errors

---

### Test 2: Create Meal Plan (2 min)
- [ ] Click "New Plan" button (top right)
- [ ] Enter name: "Test Week"
- [ ] Select start date: Today
- [ ] Select end date: 7 days from now
- [ ] Click "Create"

**Expected:** Toast says "Meal plan created successfully"

---

### Test 3: Add Custom Meal (3 min)
- [ ] Click any "+" button or "Add Meal"
- [ ] Stay on "Custom Meal" tab
- [ ] Enter name: "Leftover Pizza"
- [ ] Select meal type: "Lunch"
- [ ] Set servings: 2
- [ ] Add notes: "From last night"
- [ ] Click "Add Meal"

**Expected:** Meal appears in calendar, toast confirms

---

### Test 4: Add Recipe Meal (5 min)
- [ ] Click "Add Meal" again
- [ ] Switch to "From Recipe" tab
- [ ] Type recipe name in search box
- [ ] Try the "Course" filter dropdown
- [ ] Click on a recipe card to select it
- [ ] Verify servings pre-fill
- [ ] Click "Add Meal"

**Expected:** Recipe meal shows with image and details

---

### Test 5: Search & Filter Recipes (3 min)
In the "From Recipe" tab:
- [ ] Type "chicken" in search - should filter
- [ ] Clear search - all recipes return
- [ ] Select "Dinner" from course filter
- [ ] Select "Easy" from difficulty filter
- [ ] Verify only matching recipes show

**Expected:** Filters work in real-time

---

### Test 6: Edit a Meal (2 min)
- [ ] Find a meal you added
- [ ] Click the pencil (✏️) icon
- [ ] Change servings to 4
- [ ] Update notes
- [ ] Click "Update Meal"

**Expected:** Changes save, toast confirms

---

### Test 7: Delete a Meal (2 min)
- [ ] Find any meal
- [ ] Click the trash (🗑️) icon
- [ ] Read confirmation dialog
- [ ] Click "Delete"

**Expected:** Meal disappears, toast confirms

---

### Test 8: Switch Views (2 min)
- [ ] Click "Month" tab
- [ ] Click "Week" tab
- [ ] Click "Day" tab
- [ ] Verify meals show in all views

**Expected:** Views switch smoothly

---

### Test 9: Navigate Calendar (2 min)
- [ ] Click "Previous" button (◀)
- [ ] Click "Next" button (▶)
- [ ] Click "Today" button
- [ ] Verify date in header updates

**Expected:** Calendar navigates correctly

---

### Test 10: Weather Display (1 min)
- [ ] Look at day cells
- [ ] Check for temperature display
- [ ] Check for weather icons

**Expected:** Shows temperature or placeholder

---

## ❌ Tests You CAN'T Do Yet (Features Not Implemented)

### ⚠️ Drag & Drop
- Cannot drag meals to different days
- **Reason:** Not implemented yet

### ⚠️ Shopping List
- Cannot generate shopping list
- No shopping list button visible
- **Reason:** Not implemented yet

### ⚠️ Meal Templates
- Cannot save week as template
- Cannot load templates
- No templates button visible
- **Reason:** Not implemented yet

---

## 📊 Quick Results Form

After testing, fill this out:

### What Works? ✅
- [ ] Created meal plan
- [ ] Added custom meal
- [ ] Added recipe meal
- [ ] Recipe search works
- [ ] Recipe filters work
- [ ] Edited meal
- [ ] Deleted meal
- [ ] Switched views
- [ ] Navigated calendar
- [ ] Weather shows

### What Doesn't Work? ❌
- [ ] _________________________________
- [ ] _________________________________
- [ ] _________________________________

### Issues Found 🐛
1. _________________________________
2. _________________________________
3. _________________________________

### Suggestions 💡
1. _________________________________
2. _________________________________
3. _________________________________

---

## Need Help?

**Check Console for Errors:**
1. Press F12
2. Click "Console" tab
3. Look for red errors
4. Copy error message

**Check Network Requests:**
1. Press F12
2. Click "Network" tab
3. Look for failed requests (red)
4. Check status codes

**Restart If Needed:**
```powershell
# In terminal, press Ctrl+C to stop
npm run dev
```

---

## Test Summary

**Total Tests Available:** 10
**Total Tests Passed:** ___/10
**Bugs Found:** ___
**Missing Features:** 3 (Drag & Drop, Shopping List, Templates)

**Overall Status:** 
- [ ] All working perfectly
- [ ] Minor issues
- [ ] Major issues
- [ ] Ready for Phase 3B implementation

