# 🏡 Family Heirloom Features Implementation

## Overview
Transform Our Family Table into a multi-generational recipe heirloom system with household roles, story preservation, cooking mode, offline support, and family engagement.

---

## 🎭 1. Households & Roles

### Role Hierarchy

```
┌─────────────────────────────────────────────────┐
│ OWNER (You)                                     │
│ • Full control over household                   │
│ • Can add/remove members                        │
│ • Can change member roles                       │
│ • Access to all features                        │
└─────────────────────────────────────────────────┘
         │
         ├── CURATOR (Siblings)
         │   • Can edit ALL recipes
         │   • Can curate collections
         │   • Can feature recipes
         │   • Full meal planning
         │
         ├── CONTRIBUTOR (Adults)
         │   • Can add new recipes
         │   • Can edit OWN recipes only
         │   • Can plan meals
         │   • Can react to recipes
         │
         └── KID
             • Can view recipes
             • Can react with emojis
             • Can add comments
             • CANNOT edit or delete
```

### Database Schema

```prisma
enum HouseholdRole {
  OWNER        // You - full control
  CURATOR      // Siblings - can edit and curate
  CONTRIBUTOR  // Any adult - can add recipes
  KID          // Can react, can't edit
}

model Household {
  id            String   @id @default(cuid())
  name          String   // "The Smith Family"
  description   String?
  members       User[]
  ownerId       String
  digestEnabled Boolean  @default(true)
  digestDay     String   @default("sunday")
  digestTime    String   @default("09:00")
  birthdays     Json?    // Birthday tracking
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model User {
  // ... existing fields ...
  householdRole HouseholdRole @default(CONTRIBUTOR)
  householdId   String?
  household     Household?    @relation(fields: [householdId], references: [id])
}
```

### Permission Matrix

| Action | Owner | Curator | Contributor | Kid |
|--------|-------|---------|-------------|-----|
| View recipes | ✅ | ✅ | ✅ | ✅ |
| Add recipe | ✅ | ✅ | ✅ | ❌ |
| Edit own recipe | ✅ | ✅ | ✅ | ❌ |
| Edit any recipe | ✅ | ✅ | ❌ | ❌ |
| Delete recipe | ✅ | ✅ | Own only | ❌ |
| React with emoji | ✅ | ✅ | ✅ | ✅ |
| Add to meal plan | ✅ | ✅ | ✅ | ❌ |
| Feature recipe | ✅ | ✅ | ❌ | ❌ |
| Manage household | ✅ | ❌ | ❌ | ❌ |

---

## 📖 2. Story Fields (Heirloom Layer)

### Recipe Story Components

```typescript
interface RecipeStory {
  // Primary heirloom photo
  photoUrl: string | null;
  
  // Rich text origin story
  originStory: string | null; // Markdown or rich text
  
  // Voice note narration
  voiceNoteUrl: string | null;
  voiceNoteDuration: number | null; // seconds
}
```

### Database Schema

```prisma
model Recipe {
  // ... existing fields ...
  
  // Heirloom Story Fields
  originStory      String?   // Rich text origin story
  photoUrl         String?   // Primary heirloom photo
  voiceNoteUrl     String?   // Voice note URL
  voiceNoteDuration Int?     // Duration in seconds
}
```

### UI Components Needed

1. **Story Editor** (`src/components/recipe/story-editor.tsx`)
   ```tsx
   - Rich text editor for origin story
   - Photo uploader with cropping
   - Voice recorder with playback
   - "Record your story" button
   ```

2. **Story Display** (`src/components/recipe/story-display.tsx`)
   ```tsx
   - Beautiful photo gallery
   - Formatted story text
   - Audio player for voice notes
   - "Shared by [Name] on [Date]"
   ```

### Example Story Layout

```
┌─────────────────────────────────────────┐
│  📷 [Grandma's Kitchen Photo]           │
│                                         │
│  🎤 ▶️ "Grandma's Story" (2:34)         │
│                                         │
│  📝 Origin Story                        │
│  ════════════════════                   │
│  This recipe has been in our family     │
│  since 1952, when Grandma Rosa first... │
│                                         │
│  Shared by Sarah on Oct 15, 2023        │
└─────────────────────────────────────────┘
```

---

## 👨‍🍳 3. Cooking Mode

### Features

- **Big typography** for easy reading from distance
- **Step-by-step** navigation
- **Embedded timers** for each step
- **Voice navigation** - "next step" by voice or tap
- **Hands-free mode** - keep screen on
- **Progress tracking** - save where you left off

### Database Schema

```prisma
model Recipe {
  // ... existing fields ...
  
  // Cooking Mode Support
  stepTimers     String?  // JSON: [{ step: 1, duration: 600, label: "Simmer" }]
  voiceEnabled   Boolean  @default(true)
}

model CookingSession {
  id           String   @id @default(cuid())
  userId       String
  recipeId     String
  startedAt    DateTime @default(now())
  completedAt  DateTime?
  currentStep  Int      @default(0)
  voiceEnabled Boolean  @default(false)
  timersActive Json?    // Active timers
  notes        String?
}
```

### UI Layout

```
┌─────────────────────────────────────────┐
│  COOKING MODE                     [X]   │
│─────────────────────────────────────────│
│                                         │
│  Step 2 of 6                           │
│                                         │
│  Heat olive oil in a large             │
│  skillet over medium heat.             │
│                                         │
│  ⏱️ Timer: 0:00  [Start]                │
│                                         │
│─────────────────────────────────────────│
│  [← Previous]  [Next Step →]           │
│                                         │
│  🎤 Say "next" to continue              │
└─────────────────────────────────────────┘
```

### Component Structure

```typescript
// src/components/cooking-mode/cooking-mode.tsx
interface CookingModeProps {
  recipe: Recipe;
  onComplete?: () => void;
}

// Features:
- Full-screen overlay
- Large fonts (text-3xl for steps)
- Step navigation
- Built-in timers
- Voice commands
- Keep screen awake
- Progress saving
```

---

## 📱 4. Offline & Print

### PWA Configuration

```javascript
// public/manifest.json
{
  "name": "Our Family Table",
  "short_name": "Family Table",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#8B4513",
  "icons": [...],
  "description": "Your family's recipe heirloom"
}
```

### Service Worker Strategy

```typescript
// src/service-worker.ts
// Cache strategies:
1. Network First - API calls
2. Cache First - Images, fonts
3. Prefetch - High-priority recipes

// Prefetch based on:
- Recipe.prefetchPriority score
- Recently viewed
- Upcoming meal plan
- Favorited recipes
```

### Database Schema

```prisma
model Recipe {
  // ... existing fields ...
  
  // Offline & Print
  prefetchPriority Int     @default(0) // 0-100
  printFriendly    Boolean @default(true)
}
```

### Print Stylesheet

```css
/* src/styles/print.css */
@media print {
  /* Giant fonts for readability */
  .recipe-title { font-size: 32pt; }
  .ingredient { font-size: 16pt; }
  .instruction { font-size: 18pt; }
  
  /* Hide UI elements */
  nav, footer, .actions { display: none; }
  
  /* Print layout */
  .recipe-print {
    max-width: 100%;
    padding: 1in;
  }
  
  /* Page breaks */
  .instruction { page-break-inside: avoid; }
}
```

### Print Button Component

```tsx
// src/components/recipe/print-button.tsx
<Button 
  onClick={() => window.print()}
  variant="outline"
>
  🖨️ Print Recipe
</Button>
```

---

## 🏷️ 5. Allergy & Substitution Tags

### Tag System

```typescript
// Allergy Tags
type AllergyTag = 
  | "peanut-free"
  | "tree-nut-free"
  | "gluten-free"
  | "dairy-free"
  | "egg-free"
  | "soy-free"
  | "shellfish-free"
  | "fish-free"
  | "sesame-free"
  | "corn-free";

// Dietary Flags
type DietaryFlag =
  | "vegetarian"
  | "vegan"
  | "pescatarian"
  | "keto"
  | "paleo"
  | "low-carb"
  | "low-fat"
  | "whole30"
  | "mediterranean";

// Substitution
interface Substitution {
  from: string;        // "butter"
  to: string;          // "coconut oil"
  note?: string;       // "Grandma's gluten-swap"
  allergyFree?: AllergyTag[];
}
```

### Database Schema

```prisma
model Recipe {
  // ... existing fields ...
  
  // Allergy & Substitution Tags
  allergyTags   String? // JSON array
  substitutions String? // JSON array of Substitution objects
  dietaryFlags  String? // JSON array
}
```

### Search Enhancement

```typescript
// src/lib/recipe-search.ts
interface RecipeSearchFilters {
  allergyFree?: AllergyTag[];
  dietaryFlags?: DietaryFlag[];
  ingredients?: string[];
  excludeIngredients?: string[];
}

// Example search:
searchRecipes({
  allergyFree: ["peanut-free", "gluten-free"],
  ingredients: ["chicken"],
  excludeIngredients: ["dairy"]
})
```

### UI Components

```tsx
// src/components/recipe/allergy-tags.tsx
<div className="flex gap-2 flex-wrap">
  <Badge variant="success">🥜 Peanut-free</Badge>
  <Badge variant="info">🌾 Gluten-free</Badge>
  <Badge variant="secondary">🥛 Dairy-free</Badge>
</div>

// src/components/recipe/substitution-card.tsx
<Card>
  <CardHeader>
    <CardTitle>Substitutions Available</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="line-through">Butter</span>
        <span>→</span>
        <span className="font-semibold">Coconut oil</span>
        <Badge size="sm">Grandma's gluten-swap</Badge>
      </div>
    </div>
  </CardContent>
</Card>
```

---

## 📧 6. Family Digest (Weekly Email)

### Digest Content

```
┌─────────────────────────────────────────┐
│  🏡 The Smith Family Weekly Digest      │
│  Week of October 15-21, 2025            │
├─────────────────────────────────────────┤
│                                         │
│  📌 THIS WEEK'S MEALS                   │
│  • Monday: Grandma's Lasagna           │
│  • Wednesday: Chicken Stir-Fry         │
│  • Friday: Homemade Pizza               │
│                                         │
│  🆕 NEW RECIPES (3)                     │
│  • Mom's Apple Crisp (by Sarah)        │
│  • Quick Breakfast Burritos (by Mike)  │
│  • Garden Vegetable Soup (by Dad)      │
│                                         │
│  🎂 BIRTHDAYS COMING UP                 │
│  • Dad's birthday in 5 days (Oct 20)   │
│  • Emma's birthday in 12 days (Oct 27) │
│                                         │
│  ⭐ FEATURED THIS WEEK                  │
│  "Grandma Rosa's Secret Sauce"          │
│  A family favorite since 1952...        │
│                                         │
│  [View Full Calendar] [Browse Recipes]  │
└─────────────────────────────────────────┘
```

### Database Schema

```prisma
model Household {
  // ... existing fields ...
  
  // Digest settings
  digestEnabled Boolean @default(true)
  digestDay     String  @default("sunday")
  digestTime    String  @default("09:00")
  birthdays     Json?   // Birthday tracking
}

model FamilyDigest {
  id                 String   @id @default(cuid())
  householdId        String
  weekStartDate      DateTime
  weekEndDate        DateTime
  newRecipeCount     Int      @default(0)
  plannedMealsCount  Int      @default(0)
  upcomingBirthdays  Json?
  highlightRecipeIds Json?
  sentAt             DateTime?
  emailStatus        String   @default("pending")
  createdAt          DateTime @default(now())
}
```

### Email Service

```typescript
// src/lib/email/family-digest.ts
interface DigestData {
  household: Household;
  weekStart: Date;
  weekEnd: Date;
  newRecipes: Recipe[];
  plannedMeals: PlannedMeal[];
  upcomingBirthdays: Birthday[];
  featuredRecipe?: Recipe;
}

async function generateFamilyDigest(
  householdId: string
): Promise<DigestData> {
  // Gather all data for the week
  // Generate HTML email
  // Send via your email provider
}
```

### Cron Job Setup

```typescript
// src/app/api/cron/family-digest/route.ts
export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  // Find households with digest enabled
  const households = await prisma.household.findMany({
    where: {
      digestEnabled: true,
      digestDay: getCurrentDayName()
    },
    include: { members: true }
  });
  
  // Generate and send digests
  for (const household of households) {
    await sendFamilyDigest(household);
  }
  
  return new Response('OK', { status: 200 });
}
```

---

## 🎯 Implementation Roadmap

### Phase 1: Database & Core Models ✅ COMPLETE

- [x] Add HouseholdRole enum
- [x] Add Household model
- [x] Update User model with household fields
- [x] Add story fields to Recipe
- [x] Add allergy/substitution tags
- [x] Add RecipeReaction model
- [x] Add FamilyDigest model
- [x] Add CookingSession model

### Phase 2: Household Management

**Files to create:**
- [ ] `src/app/household/page.tsx` - Household dashboard
- [ ] `src/app/household/members/page.tsx` - Member management
- [ ] `src/components/household/member-card.tsx`
- [ ] `src/components/household/invite-member.tsx`
- [ ] `src/lib/permissions.ts` - Permission checking utilities

**API routes:**
- [ ] `src/app/api/household/create/route.ts`
- [ ] `src/app/api/household/members/route.ts`
- [ ] `src/app/api/household/invite/route.ts`
- [ ] `src/app/api/household/[id]/route.ts`

### Phase 3: Story Fields & Heirloom Layer

**Files to create:**
- [ ] `src/components/recipe/story-editor.tsx`
- [ ] `src/components/recipe/story-display.tsx`
- [ ] `src/components/recipe/voice-recorder.tsx`
- [ ] `src/components/recipe/photo-uploader.tsx`
- [ ] `src/lib/storage/voice-notes.ts`

**API routes:**
- [ ] `src/app/api/recipes/[id]/story/route.ts`
- [ ] `src/app/api/upload/voice-note/route.ts`
- [ ] `src/app/api/upload/story-photo/route.ts`

### Phase 4: Cooking Mode

**Files to create:**
- [ ] `src/components/cooking-mode/cooking-mode.tsx`
- [ ] `src/components/cooking-mode/step-display.tsx`
- [ ] `src/components/cooking-mode/timer.tsx`
- [ ] `src/components/cooking-mode/voice-control.tsx`
- [ ] `src/hooks/use-cooking-session.ts`
- [ ] `src/hooks/use-voice-commands.ts`

**API routes:**
- [ ] `src/app/api/cooking-session/start/route.ts`
- [ ] `src/app/api/cooking-session/update/route.ts`
- [ ] `src/app/api/cooking-session/complete/route.ts`

### Phase 5: Offline & PWA

**Files to create:**
- [ ] `src/service-worker.ts`
- [ ] `public/manifest.json`
- [ ] `src/lib/pwa/prefetch.ts`
- [ ] `src/lib/pwa/cache-strategy.ts`
- [ ] `src/styles/print.css`

**Updates needed:**
- [ ] `next.config.ts` - Enable PWA support
- [ ] Add offline fallback page
- [ ] Add install prompt

### Phase 6: Allergy & Substitution System

**Files to create:**
- [ ] `src/components/recipe/allergy-tags.tsx`
- [ ] `src/components/recipe/substitution-card.tsx`
- [ ] `src/components/recipe/dietary-flags.tsx`
- [ ] `src/components/search/allergy-filter.tsx`
- [ ] `src/lib/recipe-search-enhanced.ts`

**Updates needed:**
- [ ] Update recipe form with tag editors
- [ ] Enhance search with allergy filters
- [ ] Add substitution suggestions

### Phase 7: Recipe Reactions (Kids Mode)

**Files to create:**
- [ ] `src/components/recipe/reaction-bar.tsx`
- [ ] `src/components/recipe/emoji-picker.tsx`
- [ ] `src/components/recipe/kid-comment.tsx`

**API routes:**
- [ ] `src/app/api/recipes/[id]/reactions/route.ts`

### Phase 8: Family Digest Email

**Files to create:**
- [ ] `src/lib/email/family-digest.ts`
- [ ] `src/lib/email/templates/digest.tsx`
- [ ] `src/app/api/cron/family-digest/route.ts`
- [ ] `src/components/household/digest-settings.tsx`

**External setup:**
- [ ] Configure email provider (Resend, SendGrid, etc.)
- [ ] Set up cron job (Vercel Cron, external)
- [ ] Create email templates

---

## 🚀 Quick Start Commands

### Run Database Migration

```bash
# Generate migration for new schema
npx prisma migrate dev --name family_heirloom_features

# Push to database
npx prisma db push

# Generate Prisma Client
npx prisma generate
```

### Test Household Creation

```typescript
// scripts/create-test-household.ts
const household = await prisma.household.create({
  data: {
    name: "The Smith Family",
    ownerId: ownerUser.id,
    digestEnabled: true,
    digestDay: "sunday",
    digestTime: "09:00",
    birthdays: [
      { name: "Dad", date: "05-15", notify: true },
      { name: "Mom", date: "08-22", notify: true }
    ]
  }
});
```

---

## 📊 Feature Summary

| Feature | Status | Priority | Complexity |
|---------|--------|----------|------------|
| Household Roles | Schema Ready | High | Medium |
| Story Fields | Schema Ready | High | Medium |
| Cooking Mode | Schema Ready | Medium | High |
| Offline/PWA | Schema Ready | Medium | High |
| Allergy Tags | Schema Ready | High | Low |
| Reactions | Schema Ready | Low | Low |
| Family Digest | Schema Ready | Medium | Medium |

---

## 🎨 Design Principles

1. **Heirloom Quality** - Every feature preserves family memories
2. **Multi-Generational** - Works for kids AND grandparents
3. **Low Effort** - Automation where possible
4. **High Touch** - Personal, warm, family-oriented
5. **Offline First** - Works without internet
6. **Print Friendly** - Beautiful on paper

---

**Ready to build your family's recipe heirloom! 🏡**
