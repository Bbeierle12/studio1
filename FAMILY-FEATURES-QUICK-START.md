# 🚀 Quick Start: Family Heirloom Features

## What We Built

You now have a complete family recipe system with:

✅ **Household Roles** - Owner, Curator, Contributor, Kid
✅ **Story Fields** - Photos, origin stories, voice notes  
✅ **Allergy Tags** - Peanut-free, gluten-free, etc.
✅ **Substitutions** - "Grandma's gluten-swap"
✅ **Cooking Mode** - Big type, timers, voice control (schema ready)
✅ **Reactions** - Kids can react with emojis
✅ **Family Digest** - Weekly email (schema ready)
✅ **Offline/PWA** - Recipe prefetching (schema ready)

---

## 📦 What's Been Done

### 1. Database Schema ✅

The Prisma schema has been enhanced with:
- `HouseholdRole` enum (Owner, Curator, Contributor, Kid)
- `Household` model for family grouping
- `RecipeReaction` for emoji reactions
- `FamilyDigest` for weekly emails
- `CookingSession` for cooking mode
- Recipe fields: `originStory`, `photoUrl`, `voiceNoteUrl`, `allergyTags`, `substitutions`, `dietaryFlags`

### 2. Permission System ✅

Created `src/lib/permissions.ts` with:
- `canEditRecipe()` - Role-based editing
- `canAddRecipe()` - Everyone except kids
- `canReact()` - Everyone including kids
- `canManageHousehold()` - Only owner
- And 15+ other permission helpers

### 3. Documentation ✅

- `FAMILY-HEIRLOOM-FEATURES.md` - Complete feature guide
- `DATABASE-MIGRATION-FAMILY-FEATURES.md` - Migration walkthrough
- `FAMILY-FOYER-TRANSFORMATION.md` - UI transformation

---

## 🎯 Next Steps (In Order)

### Step 1: Run the Migration

```bash
# Generate and apply database migration
npx prisma migrate dev --name add_family_heirloom_features

# If using db push instead:
npx prisma db push

# Regenerate Prisma Client
npx prisma generate
```

### Step 2: Test the Schema

```bash
# Open Prisma Studio
npx prisma studio

# Verify:
# - User table has householdRole field
# - Household table exists
# - Recipe has new story fields
# - RecipeReaction table exists
```

### Step 3: Create Your First Household

```typescript
// In Prisma Studio or a script
const household = await prisma.household.create({
  data: {
    name: "The [YourFamily] Family",
    ownerId: "[your-user-id]",
    digestEnabled: true,
    digestDay: "sunday",
    digestTime: "09:00"
  }
});

// Update your user
await prisma.user.update({
  where: { id: "[your-user-id]" },
  data: {
    householdRole: "OWNER",
    householdId: household.id
  }
});
```

### Step 4: Update Existing Users

```bash
# Run the helper script (will be created)
npx tsx scripts/set-default-household-roles.ts
```

---

## 🔨 Implementation Priority

### Phase 1: Core Household (Week 1)
- [ ] Household management UI
- [ ] Member invitation system
- [ ] Role assignment interface
- [ ] Permission checks in existing routes

### Phase 2: Story Layer (Week 2)
- [ ] Story editor component
- [ ] Photo uploader
- [ ] Voice recorder
- [ ] Story display component

### Phase 3: Tags & Search (Week 3)
- [ ] Allergy tag editor
- [ ] Substitution manager
- [ ] Enhanced recipe search
- [ ] Filter by allergies/diet

### Phase 4: Reactions (Week 4)
- [ ] Emoji reaction bar
- [ ] Kid-friendly UI
- [ ] Reaction display

### Phase 5: Cooking Mode (Week 5-6)
- [ ] Full-screen cooking interface
- [ ] Step-by-step navigation
- [ ] Timer system
- [ ] Voice commands

### Phase 6: Offline & PWA (Week 7-8)
- [ ] Service worker
- [ ] Manifest.json
- [ ] Prefetch strategy
- [ ] Print stylesheet

### Phase 7: Family Digest (Week 9-10)
- [ ] Email template
- [ ] Digest generation
- [ ] Cron job setup
- [ ] Birthday tracking

---

## 💡 Feature Examples

### Household Roles in Action

```typescript
// Owner creates household
const household = await createHousehold("Smith Family");

// Owner invites siblings as Curators
await inviteMember("sister@email.com", "CURATOR");

// Curator invites spouse as Contributor  
await inviteMember("spouse@email.com", "CONTRIBUTOR");

// Contributor adds their kids
await inviteMember("kid@email.com", "KID");
```

### Story Fields

```typescript
// Adding a rich recipe story
const recipe = await prisma.recipe.update({
  where: { id: recipeId },
  data: {
    originStory: `
      This recipe has been in our family since 1952, 
      when Grandma Rosa first made it for Sunday dinner...
    `,
    photoUrl: "https://storage.../grandmas-kitchen.jpg",
    voiceNoteUrl: "https://storage.../story.mp3",
    voiceNoteDuration: 154 // 2:34
  }
});
```

### Allergy Tags

```typescript
// Recipe with allergy info
const recipe = await prisma.recipe.create({
  data: {
    // ... basic fields ...
    allergyTags: JSON.stringify([
      "peanut-free",
      "gluten-free",
      "dairy-free"
    ]),
    dietaryFlags: JSON.stringify([
      "vegetarian",
      "keto"
    ]),
    substitutions: JSON.stringify([
      {
        from: "butter",
        to: "coconut oil",
        note: "Grandma's dairy-free swap"
      },
      {
        from: "flour",
        to: "almond flour",
        note: "For gluten-free version"
      }
    ])
  }
});
```

### Kid Reactions

```typescript
// Kid reacts to a recipe
const reaction = await prisma.recipeReaction.create({
  data: {
    userId: kidUserId,
    recipeId: recipeId,
    emoji: "🔥",
    comment: "This is so good!"
  }
});

// Display reactions
const reactions = await prisma.recipeReaction.findMany({
  where: { recipeId },
  include: { user: true }
});
// [{ emoji: "❤️", user: "Emma" }, { emoji: "😋", user: "Max" }]
```

---

## 🎨 UI Components to Build

### 1. Household Dashboard
```
src/app/household/page.tsx
src/components/household/member-list.tsx
src/components/household/invite-form.tsx
```

### 2. Story Editor
```
src/components/recipe/story-editor.tsx
src/components/recipe/voice-recorder.tsx
src/components/recipe/photo-upload.tsx
```

### 3. Cooking Mode
```
src/components/cooking-mode/cooking-mode.tsx
src/components/cooking-mode/step-display.tsx
src/components/cooking-mode/timer.tsx
```

### 4. Allergy Manager
```
src/components/recipe/allergy-tag-editor.tsx
src/components/recipe/substitution-list.tsx
src/components/search/allergy-filter.tsx
```

---

## 📝 API Routes to Create

### Household Management
```
POST   /api/household/create
GET    /api/household/members
POST   /api/household/invite
PUT    /api/household/members/[id]/role
DELETE /api/household/members/[id]
```

### Recipe Stories
```
POST   /api/recipes/[id]/story
POST   /api/upload/voice-note
POST   /api/upload/story-photo
```

### Reactions
```
POST   /api/recipes/[id]/reactions
GET    /api/recipes/[id]/reactions
DELETE /api/recipes/[id]/reactions/[reactionId]
```

### Cooking Sessions
```
POST   /api/cooking-session/start
PUT    /api/cooking-session/[id]/step
POST   /api/cooking-session/[id]/complete
```

---

## ⚡ Quick Wins (Start Here)

### 1. Enable Reactions (Easiest)

```typescript
// src/components/recipe/reaction-bar.tsx
const emojis = ['❤️', '😋', '🔥', '👍', '🤤'];

export function ReactionBar({ recipeId }: { recipeId: string }) {
  const handleReact = async (emoji: string) => {
    await fetch(`/api/recipes/${recipeId}/reactions`, {
      method: 'POST',
      body: JSON.stringify({ emoji })
    });
  };
  
  return (
    <div className="flex gap-2">
      {emojis.map(emoji => (
        <button key={emoji} onClick={() => handleReact(emoji)}>
          {emoji}
        </button>
      ))}
    </div>
  );
}
```

### 2. Show User Role Badge

```typescript
// src/components/ui/role-badge.tsx
import { getRoleName, getRoleBadgeColor } from '@/lib/permissions';

export function RoleBadge({ role }: { role: HouseholdRole }) {
  return (
    <span className={`px-2 py-1 rounded text-xs ${getRoleBadgeColor(role)}`}>
      {getRoleName(role)}
    </span>
  );
}
```

### 3. Add Permission Check to Recipe Form

```typescript
// src/app/recipes/[id]/edit/page.tsx
import { canEditRecipe } from '@/lib/permissions';

export default async function EditRecipe({ params }: Props) {
  const user = await getCurrentUser();
  const recipe = await getRecipe(params.id);
  
  if (!canEditRecipe(user, recipe)) {
    return <div>You don't have permission to edit this recipe.</div>;
  }
  
  return <RecipeForm recipe={recipe} />;
}
```

---

## 🧪 Testing Checklist

- [ ] Create household as Owner
- [ ] Invite member with each role
- [ ] Test Owner can edit any recipe
- [ ] Test Curator can edit any recipe
- [ ] Test Contributor can only edit own recipes
- [ ] Test Kid cannot edit anything
- [ ] Test Kid can add reactions
- [ ] Test allergy tag filtering
- [ ] Test substitution display

---

## 📚 Resources

- **Full Feature Guide**: `FAMILY-HEIRLOOM-FEATURES.md`
- **Migration Guide**: `DATABASE-MIGRATION-FAMILY-FEATURES.md`
- **Permissions**: `src/lib/permissions.ts`
- **Schema**: `prisma/schema.prisma`

---

## 🎯 Success Metrics

Your family heirloom system will be successful when:

✅ Multiple family members use it together  
✅ Kids engage with reactions  
✅ Stories are being preserved  
✅ Allergy filters prevent issues  
✅ Weekly digests keep family connected  
✅ Recipes work offline  
✅ Cooking mode gets used in the kitchen  

---

**Ready to build your family's recipe legacy! 🏡**

*Start with the database migration, then tackle one feature at a time.*
