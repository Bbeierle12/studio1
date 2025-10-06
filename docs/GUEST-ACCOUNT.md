# 🎭 Guest Account Information

## Login Credentials

**URL:** http://localhost:9002/login

```
Email:    guest@ourfamilytable.com
Password: Guest123!
```

---

## What's Included

### ✅ Guest User Profile
- **Name:** Guest User
- **Role:** USER (standard user permissions)
- **Status:** Active
- **Bio:** Guest account for testing the meal planning calendar

### ✅ Sample Recipes (4 recipes)

The guest account comes pre-loaded with 4 sample recipes to test the meal planning features:

1. **Quick Chicken Stir-Fry** 
   - Course: Dinner
   - Cuisine: Asian
   - Difficulty: Easy
   - Prep Time: 25 min
   - Servings: 4

2. **Hearty Breakfast Burrito**
   - Course: Breakfast
   - Cuisine: Mexican
   - Difficulty: Easy
   - Prep Time: 15 min
   - Servings: 2

3. **Classic Pasta Marinara**
   - Course: Dinner
   - Cuisine: Italian
   - Difficulty: Easy
   - Prep Time: 30 min
   - Servings: 6

4. **Fresh Greek Salad**
   - Course: Lunch
   - Cuisine: Greek
   - Difficulty: Easy
   - Prep Time: 10 min
   - Servings: 4

---

## Testing Guide

### Quick Start (5 minutes)

1. **Login**
   - Go to http://localhost:9002/login
   - Enter guest credentials above
   - Click "Sign In"

2. **View Recipes**
   - Click "Recipes" in header
   - See your 4 sample recipes
   - Try clicking on one to view details

3. **Create Meal Plan**
   - Click "Calendar" in header
   - Click "New Plan" button
   - Name: "Test Week"
   - Set date range (this week)
   - Click "Create"

4. **Add Meals from Recipes**
   - Click any "+" button or "Add Meal"
   - Switch to "From Recipe" tab
   - Select "Quick Chicken Stir-Fry"
   - Click "Add Meal"
   - Repeat with other recipes

5. **Test Features**
   - ✅ Switch between Month/Week/Day views
   - ✅ Edit a meal (click pencil icon)
   - ✅ Delete a meal (click trash icon)
   - ✅ Search recipes in the recipe selector
   - ✅ Filter by course or difficulty
   - ✅ Add custom meals (not from recipes)

---

## Complete Test Checklist

Follow the detailed testing guide in:
**`docs/MANUAL-TESTING-CHECKLIST.md`**

---

## Features Available

### ✅ Phase 3A Features (All Working)
- [x] Calendar with Month/Week/Day views
- [x] Create meal plans
- [x] Add custom meals
- [x] Add recipe-based meals
- [x] Recipe search & filters
- [x] Edit any meal
- [x] Delete meals
- [x] Weather display
- [x] Multiple meal plans

### ⚠️ Phase 3B Features (Not Yet Implemented)
- [ ] Drag & drop meals
- [ ] Shopping list generation
- [ ] Meal templates

---

## Account Management

### Reset Guest Account
If you want to reset the guest account to its original state:

```powershell
npx tsx scripts/create-guest.ts
```

This will:
- Reset the password
- Recreate the 4 sample recipes
- Keep the same guest user ID

### Delete Guest Account
To remove the guest account (if needed):

```powershell
# Connect to Prisma Studio
npx prisma studio

# Or use SQL
# DELETE FROM users WHERE email = 'guest@ourfamilytable.com';
```

---

## Security Notes

⚠️ **For Development Only**
- This is a test account for local development
- Password is publicly visible in this document
- Do not use in production
- Do not expose this account publicly

🔒 **Production Considerations**
- Change password to something secure
- Remove or disable guest account before deployment
- Implement proper user registration
- Add email verification

---

## Troubleshooting

### Can't Log In?
1. Verify dev server is running: http://localhost:9002
2. Check credentials are exactly: `guest@ourfamilytable.com` / `Guest123!`
3. Try resetting the guest account: `npx tsx scripts/create-guest.ts`

### No Recipes Showing?
1. Make sure you're logged in as guest
2. Navigate to /recipes
3. If still empty, run the guest creation script again

### Database Connection Issues?
1. Check `.env.local` has `DATABASE_URL`
2. Run: `npx prisma db push`
3. Run: `npx prisma generate`

---

## Quick Links

- **Login:** http://localhost:9002/login
- **Recipes:** http://localhost:9002/recipes
- **Calendar:** http://localhost:9002/meal-plan
- **Profile:** http://localhost:9002/settings

---

## Next Steps

After testing with the guest account:

1. **Report Issues**: Document any bugs or unexpected behavior
2. **Test All Features**: Use `docs/MANUAL-TESTING-CHECKLIST.md`
3. **Decide on Phase 3B**: Determine if you need shopping lists, templates, and drag & drop
4. **Create Your Own Account**: Register at http://localhost:9002/register

---

## Script Location

The guest account creation script is located at:
`scripts/create-guest.ts`

You can modify it to:
- Change the password
- Add more sample recipes
- Customize the guest profile
- Add different types of test data

---

**Created:** October 5, 2025
**Status:** ✅ Active and Ready for Testing

