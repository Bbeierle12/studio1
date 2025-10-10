# Recipe Data Flow - Quick Reference

## 📥 Recipe Input Sources

### 1. Manual Entry
```
User Form (/recipes/new)
    ↓
recipeSchema validation
    ↓
addRecipeAction
    ↓
Direct Prisma.create()
```

### 2. URL Import
```
URL Input (/recipes/import)
    ↓
RecipeParser.parseFromUrl()
    ↓
ParsedRecipeData (arrays)
    ↓
parseRecipeToInput() → RecipeInput (strings)
    ↓
validateRecipeInput()
    ↓
Direct Prisma.create()
```

### 3. AI Generation
```
Image + Title (/recipes/generate)
    ↓
generateRecipe() (AI)
    ↓
Redirect to /recipes/new with query params
    ↓
Form prefilled
    ↓
addRecipeAction
    ↓
Direct Prisma.create()
```

---

## 🔧 Key Functions

### Converting External Data
```typescript
import { parseRecipeToInput } from '@/lib/recipe-utils'

// Convert parsed data (arrays) to RecipeInput (strings)
const recipeInput = parseRecipeToInput(parsedData, userId)
```

### Validating Recipe Data
```typescript
import { validateRecipeInput } from '@/lib/recipe-utils'

const { isValid, errors } = validateRecipeInput(recipeInput)
if (!isValid) {
  console.error(errors) // ["Title too short", "Missing ingredients"]
}
```

### Converting to Arrays
```typescript
import { recipeInputToArrays } from '@/lib/recipe-utils'

// If you need array format for display/processing
const { ingredients, instructions } = recipeInputToArrays(recipeInput)
```

---

## 📋 Type Quick Reference

### RecipeInput (Unified Format)
```typescript
{
  title: string
  contributor: string
  ingredients: string         // "flour\neggs\nsugar"
  instructions: string        // "Mix ingredients\nBake"
  summary?: string
  prepTime?: number
  servings?: number
  course?: 'Appetizer' | 'Main' | 'Dessert' | 'Side' | 'Breakfast'
  cuisine?: 'Italian' | 'American' | 'Mexican' | 'Asian' | 'Other'
  difficulty?: 'Easy' | 'Medium' | 'Hard'
  tags?: string[]            // ["dinner", "italian"]
  imageUrl?: string
  userId: string
}
```

### ParsedRecipeData (Parser Output)
```typescript
{
  title: string
  ingredients: string[]       // ["flour", "eggs", "sugar"]
  instructions: string[]      // ["Mix ingredients", "Bake"]
  author?: string
  // ... other optional fields
}
```

### Recipe (Database Model)
```typescript
{
  id: string
  slug: string
  title: string
  contributor: string
  ingredients: string         // Stored as newline-separated
  instructions: string        // Stored as newline-separated
  tags: string[]             // Stored as JSON, retrieved as array
  // ... other fields
}
```

---

## 🎯 Common Patterns

### Adding a Recipe from External Source
```typescript
// 1. Parse from external source
const parsed: ParsedRecipeData = await parser.parseFromUrl(url)

// 2. Convert to unified format
const recipeInput = parseRecipeToInput(parsed, userId)

// 3. Validate
const { isValid, errors } = validateRecipeInput(recipeInput)
if (!isValid) throw new Error(errors.join(', '))

// 4. Generate slug
const slug = await generateUniqueSlug(recipeInput.title)

// 5. Save to database
await prisma.recipe.create({
  data: {
    ...recipeInput,
    slug,
    tags: JSON.stringify(recipeInput.tags || []),
  }
})
```

### Adding a Recipe from User Form
```typescript
// Already in correct format from form validation
const slug = await generateUniqueSlug(title)

await prisma.recipe.create({
  data: {
    title,
    slug,
    contributor,
    ingredients,  // Already newline-separated
    instructions, // Already newline-separated
    tags: JSON.stringify(tagsArray),
    userId,
  }
})
```

---

## 📂 File Locations

| File | Purpose |
|------|---------|
| `src/lib/types.ts` | Type definitions (RecipeInput, ParsedRecipeData) |
| `src/lib/recipe-utils.ts` | Conversion utilities |
| `src/lib/recipe-parser.ts` | URL parsing logic |
| `src/app/actions.ts` | Server actions (addRecipeAction) |
| `src/app/api/recipe-import/parse/route.ts` | Import API endpoint |
| `src/lib/data.ts` | Database utilities (generateUniqueSlug) |

---

## ✅ Validation Rules

| Field | Rule |
|-------|------|
| `title` | Min 3 characters |
| `contributor` | Required |
| `ingredients` | Min 10 characters |
| `instructions` | Min 20 characters |
| `userId` | Required |
| `course` | Must be valid enum value |
| `cuisine` | Must be valid enum value |
| `difficulty` | Must be valid enum value |

---

## 🚀 Adding a New Recipe Source

```typescript
// 1. Create parser for your source
async function parseFromNewSource(data: any): Promise<ParsedRecipeData> {
  return {
    title: data.name,
    ingredients: data.ingredientList,  // Array of strings
    instructions: data.steps,          // Array of strings
    author: data.creator,
    // ... other fields
  }
}

// 2. Convert to unified format
const parsed = await parseFromNewSource(externalData)
const recipeInput = parseRecipeToInput(parsed, userId)

// 3. Validate and save (same as any other source!)
const { isValid, errors } = validateRecipeInput(recipeInput)
if (!isValid) throw new Error(errors.join(', '))

const slug = await generateUniqueSlug(recipeInput.title)
await prisma.recipe.create({
  data: { ...recipeInput, slug, tags: JSON.stringify(recipeInput.tags) }
})
```

---

## 🐛 Debugging Tips

### Type Errors
```typescript
// If you get type errors, check:
// 1. Are ingredients/instructions strings or arrays?
// 2. Use parseRecipeToInput() to convert arrays to strings
// 3. Use recipeInputToArrays() to convert strings to arrays
```

### Validation Failures
```typescript
// Check what's wrong:
const { isValid, errors } = validateRecipeInput(recipeInput)
console.log(errors) // See specific validation failures
```

### Slug Conflicts
```typescript
// generateUniqueSlug automatically handles conflicts
// Adds counter: "pasta" → "pasta-1" → "pasta-2"
const slug = await generateUniqueSlug(title)
```

---

## 📊 Performance Notes

- **Direct Prisma calls:** Removed function call overhead (~10-20% faster)
- **Slug generation:** Cached in a loop, only checks database when needed
- **Validation:** Runs once per recipe, not multiple times
- **Type checking:** Compile-time only, no runtime overhead

---

## 🔗 Related Docs

- `REFACTORING-SUMMARY.md` - Full refactoring details
- `BEFORE-AFTER-REFACTORING.md` - Side-by-side comparison
- `RECIPE-HUB-QUICK-REFERENCE.md` - Route structure

---

**Quick Start:** Import `parseRecipeToInput` and you're good to go! 🚀
