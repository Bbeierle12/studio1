# 🔄 Database Migration Guide - Family Heirloom Features

## Overview
This guide walks you through migrating your database to support the new family heirloom features.

## ⚠️ Before You Start

### Backup Your Database
```bash
# For PostgreSQL
pg_dump your_database > backup_$(date +%Y%m%d).sql

# Or use Prisma Studio to export data
npx prisma studio
```

### Check Current Schema
```bash
npx prisma db pull
npx prisma generate
```

---

## 📋 Migration Checklist

- [ ] Backup database
- [ ] Review new schema changes
- [ ] Run migration
- [ ] Verify data integrity
- [ ] Update existing users with default household roles
- [ ] Test permission system

---

## 🚀 Step-by-Step Migration

### Step 1: Review the Changes

The new schema adds:

1. **New Enum**: `HouseholdRole`
2. **New Models**:
   - `Household`
   - `RecipeReaction`
   - `FamilyDigest`
   - `CookingSession`

3. **Updated Models**:
   - `User` - Added household fields
   - `Recipe` - Added story fields, allergy tags, cooking mode support

### Step 2: Generate Migration

```bash
# This will create a new migration file
npx prisma migrate dev --name add_family_heirloom_features
```

When prompted:
- ✅ Yes, create the migration
- Review the generated SQL
- Apply the migration

### Step 3: Verify Migration

```bash
# Check that the migration was applied
npx prisma migrate status

# Regenerate Prisma Client
npx prisma generate
```

### Step 4: Set Default Values for Existing Users

Create a script to update existing users:

```typescript
// scripts/set-default-household-roles.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Setting default household roles...');
  
  // Update all existing users to CONTRIBUTOR role
  const result = await prisma.user.updateMany({
    where: {
      householdRole: null // or check for existing null values
    },
    data: {
      householdRole: 'CONTRIBUTOR'
    }
  });
  
  console.log(`✅ Updated ${result.count} users`);
  
  // Optional: Create a default household for first user
  const firstUser = await prisma.user.findFirst({
    orderBy: { createdAt: 'asc' }
  });
  
  if (firstUser && !firstUser.householdId) {
    const household = await prisma.household.create({
      data: {
        name: 'My Family',
        ownerId: firstUser.id,
        digestEnabled: true,
        digestDay: 'sunday',
        digestTime: '09:00'
      }
    });
    
    await prisma.user.update({
      where: { id: firstUser.id },
      data: {
        householdId: household.id,
        householdRole: 'OWNER'
      }
    });
    
    console.log(`✅ Created household for ${firstUser.email}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

Run the script:
```bash
npx tsx scripts/set-default-household-roles.ts
```

---

## 🧪 Testing the Migration

### Test 1: Check Household Roles

```typescript
// In Prisma Studio or a test script
const user = await prisma.user.findFirst({
  include: { household: true }
});

console.log('User role:', user?.householdRole);
console.log('Household:', user?.household?.name);
```

### Test 2: Create Test Recipe with New Fields

```typescript
const recipe = await prisma.recipe.create({
  data: {
    title: 'Test Recipe',
    slug: 'test-recipe-' + Date.now(),
    contributor: 'Test User',
    summary: 'Test summary',
    ingredients: JSON.stringify(['ingredient 1']),
    instructions: JSON.stringify(['step 1']),
    tags: JSON.stringify(['test']),
    imageUrl: 'https://example.com/image.jpg',
    imageHint: 'test image',
    userId: user.id,
    // New fields
    originStory: 'This is a test origin story',
    photoUrl: 'https://example.com/photo.jpg',
    allergyTags: JSON.stringify(['peanut-free', 'gluten-free']),
    dietaryFlags: JSON.stringify(['vegetarian']),
    substitutions: JSON.stringify([
      { from: 'butter', to: 'olive oil', note: 'Healthier option' }
    ])
  }
});

console.log('✅ Recipe created with new fields');
```

### Test 3: Create Test Reaction

```typescript
const reaction = await prisma.recipeReaction.create({
  data: {
    userId: user.id,
    recipeId: recipe.id,
    emoji: '❤️',
    comment: 'I love this recipe!'
  }
});

console.log('✅ Reaction created');
```

---

## 🔍 Common Issues & Solutions

### Issue 1: Migration Fails on `householdRole`

**Error**: Column "householdRole" cannot be null

**Solution**: The migration should set a default value. If not:
```sql
-- Run this SQL directly if needed
ALTER TABLE "User" 
ALTER COLUMN "householdRole" 
SET DEFAULT 'CONTRIBUTOR';

UPDATE "User" 
SET "householdRole" = 'CONTRIBUTOR' 
WHERE "householdRole" IS NULL;
```

### Issue 2: Existing Recipes Missing New Fields

**Solution**: New fields are all nullable or have defaults. No action needed.

### Issue 3: Prisma Client Out of Sync

**Error**: Type errors about missing fields

**Solution**:
```bash
npx prisma generate
npm run dev # Restart dev server
```

---

## 📝 Post-Migration Tasks

### 1. Update API Routes

Add permission checks to existing routes:

```typescript
// src/app/api/recipes/[id]/route.ts
import { canEditRecipe } from '@/lib/permissions';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  const recipe = await prisma.recipe.findUnique({
    where: { id: params.id }
  });
  
  // NEW: Check permissions
  if (!canEditRecipe(user, recipe)) {
    return NextResponse.json(
      { error: 'Permission denied' },
      { status: 403 }
    );
  }
  
  // ... rest of the code
}
```

### 2. Create Permission Helper

```typescript
// src/lib/permissions.ts
import { User, Recipe, HouseholdRole } from '@prisma/client';

export function canEditRecipe(
  user: User | null,
  recipe: Recipe | null
): boolean {
  if (!user || !recipe) return false;
  
  // Owner and Curator can edit any recipe
  if (user.householdRole === 'OWNER' || user.householdRole === 'CURATOR') {
    return true;
  }
  
  // Contributors can edit their own recipes
  if (user.householdRole === 'CONTRIBUTOR' && recipe.userId === user.id) {
    return true;
  }
  
  // Kids can't edit
  return false;
}

export function canAddRecipe(user: User | null): boolean {
  if (!user) return false;
  
  // Everyone except kids can add recipes
  return user.householdRole !== 'KID';
}

export function canReact(user: User | null): boolean {
  // Everyone can react, even kids!
  return !!user;
}

export function canManageHousehold(user: User | null): boolean {
  if (!user) return false;
  return user.householdRole === 'OWNER';
}
```

### 3. Update Forms

Add new fields to recipe form:

```typescript
// src/app/recipes/new/page.tsx or edit page
<Tabs defaultValue="basic">
  <TabsList>
    <TabsTrigger value="basic">Basic Info</TabsTrigger>
    <TabsTrigger value="story">Story</TabsTrigger>
    <TabsTrigger value="tags">Tags & Allergies</TabsTrigger>
  </TabsList>
  
  <TabsContent value="story">
    <StoryEditor
      originStory={originStory}
      photoUrl={photoUrl}
      voiceNoteUrl={voiceNoteUrl}
      onChange={(data) => setStoryData(data)}
    />
  </TabsContent>
  
  <TabsContent value="tags">
    <AllergyTagEditor
      allergyTags={allergyTags}
      dietaryFlags={dietaryFlags}
      substitutions={substitutions}
      onChange={(data) => setTagData(data)}
    />
  </TabsContent>
</Tabs>
```

---

## 🎯 Next Steps

After successful migration:

1. ✅ Test all existing functionality
2. ✅ Implement household management UI
3. ✅ Add story editor components
4. ✅ Build cooking mode
5. ✅ Set up PWA configuration
6. ✅ Create family digest system

---

## 📞 Rollback Plan

If you need to rollback:

```bash
# Check migration history
npx prisma migrate status

# Rollback to previous migration
npx prisma migrate resolve --rolled-back <migration_name>

# Restore from backup
psql your_database < backup_YYYYMMDD.sql
```

---

## ✅ Migration Verification Checklist

- [ ] All tables exist in database
- [ ] Enums are created (HouseholdRole)
- [ ] Existing users have householdRole set
- [ ] Existing recipes are accessible
- [ ] New recipe fields are nullable/defaulted correctly
- [ ] Prisma Client regenerated
- [ ] TypeScript types are correct
- [ ] Dev server restarts without errors
- [ ] Can create new recipes with story fields
- [ ] Can create reactions
- [ ] Permission system works

---

**Your database is now ready for family heirloom features! 🎉**
