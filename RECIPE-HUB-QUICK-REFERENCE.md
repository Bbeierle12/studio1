# Recipe Hub - Quick Reference Guide

## 🎯 What Changed

### Old Structure (Deprecated)
```
/recipes              → Browse only
/recipes/new          → Manual creation
/recipes/generate     → AI generation
/recipes/import       → URL import
/recipes/[slug]       → Full page view
```

### New Structure (Active)
```
/recipes              → Unified hub with all features
  ├── ?tab=browse     → Browse recipes (default)
  ├── ?tab=create     → Create (manual/AI/import)
  ├── ?tab=my-recipes → User's recipes
  └── ?recipe=id      → Opens drawer with recipe details
```

## 📦 Component Map

### Main Page
- **Location**: `src/app/recipes/page.tsx`
- **Type**: Client component ('use client')
- **Purpose**: Main hub with tab navigation and state management

### Sub-Components (in `src/components/recipes/`)
1. **recipe-browser.tsx** - Browse all recipes with search/filter
2. **recipe-creator.tsx** - Create via manual/AI/import
3. **my-recipes.tsx** - User's created/favorite recipes
4. **recipe-detail-drawer.tsx** - Recipe details in slide-out drawer
5. **recipe-sidebar.tsx** - Context-aware filters and actions

## 🔌 Integration Points

### Existing Components Used
```typescript
import { RecipeForm } from '@/components/recipe-form';
import { RecipeGenerator } from '@/components/recipe-generator';
import { RecipeCard } from '@/components/recipe-card';
import { VoiceAssistant } from '@/components/voice-assistant';
```

### API Endpoints Used
```typescript
GET /api/recipes              → Fetch all recipes
GET /api/recipes?query=...    → Search recipes
GET /api/recipes?userId=...   → User's recipes
GET /api/recipes/favorites    → User's favorites
GET /api/recipes/:id          → Single recipe
```

## 🎨 UI Components Used

### shadcn/ui Components
- `Tabs` - Main navigation
- `TabsList`, `TabsTrigger`, `TabsContent`
- `Sheet`, `SheetContent`, `SheetHeader` - Drawer
- `Input` - Search
- `Button`, `Badge`, `Card`
- `Select` - Sort dropdown
- `Skeleton` - Loading states

### Custom Components
- `RecipeCard` - Recipe display cards
- `RecipeForm` - Manual entry form
- `RecipeGenerator` - AI generation
- `VoiceAssistant` - Cooking assistant

## 🔄 State Management

### Local State
```typescript
const [selectedRecipe, setSelectedRecipe] = useState<string | null>(null);
const [activeTab, setActiveTab] = useState('browse');
const [searchQuery, setSearchQuery] = useState('');
const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
```

### React Query
```typescript
useQuery(['recipes', searchQuery, selectedTag], fetchRecipes);
useQuery(['recipe', recipeId], fetchRecipe);
useQuery(['my-recipes', userId], fetchUserRecipes);
```

## 🚀 Usage Examples

### Navigate to Create Tab
```typescript
<Link href="/recipes?tab=create">Create Recipe</Link>
```

### Open Specific Recipe
```typescript
<Link href="/recipes?recipe=abc123">View Recipe</Link>
```

### Programmatic Navigation
```typescript
router.push('/recipes?tab=browse');
router.push('/recipes?recipe=xyz456');
```

## 📱 Responsive Design

### Desktop (≥768px)
- Sidebar visible
- Grid view (4 columns max)
- Full tab labels

### Mobile (<768px)
- Sidebar hidden
- Grid view (1-2 columns)
- Icon-only tabs
- Full-width drawer

## 🎭 Feature Toggles

### Currently Active
- ✅ Browse recipes
- ✅ Search recipes
- ✅ Sort recipes
- ✅ Grid/list toggle
- ✅ Recipe drawer
- ✅ Voice assistant in drawer
- ✅ Deep linking

### Phase 2 (To Implement)
- ⏳ Tag filtering
- ⏳ Category filtering
- ⏳ Favorites toggle
- ⏳ Recently viewed tracking
- ⏳ URL import integration
- ⏳ Print functionality
- ⏳ Share functionality

## 🐛 Known Issues

1. **TypeScript Module Resolution**
   - Components may show "Cannot find module" in editor
   - Files exist and will work at runtime
   - May need TypeScript restart

2. **RecipeFilter Integration**
   - Commented out in recipe-browser.tsx
   - Needs API endpoint for tags

3. **Recipe Type Casting**
   - Using `as any` temporarily
   - Need to unify Recipe type across app

## 🔧 Maintenance

### Adding a New Tab
```typescript
// 1. Add to TabsList
<TabsTrigger value="new-tab">New Tab</TabsTrigger>

// 2. Add TabsContent
<TabsContent value="new-tab">
  <YourComponent />
</TabsContent>

// 3. Update URL handling
if (tab && ['browse', 'create', 'my-recipes', 'new-tab'].includes(tab)) {
  setActiveTab(tab);
}
```

### Adding New Filters
```typescript
// Update recipe-browser.tsx
const [newFilter, setNewFilter] = useState('');

// Add to query
useQuery(['recipes', searchQuery, selectedTag, newFilter], ...);
```

## 📊 Performance

### Optimizations Applied
- React Query caching (5 min staleTime)
- Lazy loading with Suspense
- Skeleton loading states
- URL-based state (preserves on refresh)

### Future Optimizations
- Infinite scroll for recipes
- Image lazy loading
- Virtual scrolling for large lists
- Debounced search

## 🎉 Quick Win Features

Easy additions that provide value:

1. **Keyboard Shortcuts**
   - `Cmd+K` for search
   - `Cmd+N` for new recipe
   - `Esc` to close drawer

2. **Bulk Actions**
   - Select multiple recipes
   - Add all to meal plan
   - Export multiple recipes

3. **Recipe Stats**
   - View count
   - Favorite count
   - Last viewed date

---

**Version**: 1.0.0  
**Date**: October 9, 2025  
**Status**: Phase 1 Complete ✅
