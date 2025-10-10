# Recipe Hub - Developer Quick Start 🚀

## Get Started in 5 Minutes

### 1. Navigate to Recipe Hub
```
http://localhost:3000/recipes
```

### 2. File Structure
```
src/
├── app/
│   └── recipes/
│       ├── page.tsx           ← Main Recipe Hub
│       └── page-old.tsx       ← Backup (can delete later)
├── components/
│   └── recipes/
│       ├── recipe-browser.tsx        ← Browse/search
│       ├── recipe-creator.tsx        ← Create recipes
│       ├── my-recipes.tsx            ← User's recipes
│       ├── recipe-detail-drawer.tsx  ← Recipe viewer
│       └── recipe-sidebar.tsx        ← Filters/actions
├── lib/
│   └── recipe-api.ts          ← API functions
└── types/
    └── recipe.ts              ← Type definitions
```

## Quick Code Examples

### Fetch Recipes
```typescript
import { fetchRecipes } from '@/lib/recipe-api';

const recipes = await fetchRecipes({
  query: 'chicken',
  tag: 'italian',
  difficulty: 'easy'
});
```

### Use in Component
```typescript
import { useQuery } from '@tanstack/react-query';
import { Recipe } from '@/types/recipe';

const { data: recipes, isLoading } = useQuery<Recipe[]>({
  queryKey: ['recipes', searchQuery],
  queryFn: () => fetchRecipes({ query: searchQuery }),
  staleTime: 5 * 60 * 1000,
});
```

### Navigate to Tab
```typescript
// Via Link
<Link href="/recipes?tab=create">Create Recipe</Link>

// Via Router
router.push('/recipes?tab=browse');

// Open specific recipe
router.push('/recipes?recipe=abc123');
```

## Common Tasks

### Add a New Filter
```typescript
// 1. Add state
const [newFilter, setNewFilter] = useState('');

// 2. Add to query
const { data } = useQuery({
  queryKey: ['recipes', searchQuery, newFilter],
  queryFn: () => fetchRecipes({ query: searchQuery, newFilter }),
});

// 3. Add UI
<Select value={newFilter} onValueChange={setNewFilter}>
  <SelectItem value="option1">Option 1</SelectItem>
</Select>
```

### Add a New Action to Drawer
```typescript
// In recipe-detail-drawer.tsx
<Button variant="outline" size="sm" onClick={handleNewAction}>
  <Icon className="h-4 w-4 mr-2" />
  New Action
</Button>

const handleNewAction = () => {
  // Your logic here
  toast({
    title: 'Success',
    description: 'Action completed',
  });
};
```

### Add a New Tab
```typescript
// 1. In page.tsx, add to TabsList
<TabsTrigger value="new-tab" className="gap-2">
  <Icon className="h-4 w-4" />
  New Tab
</TabsTrigger>

// 2. Add TabsContent
<TabsContent value="new-tab">
  <YourNewComponent />
</TabsContent>

// 3. Update URL handling
if (tab && ['browse', 'create', 'my-recipes', 'new-tab'].includes(tab)) {
  setActiveTab(tab);
}
```

## API Integration

### Available Functions
```typescript
fetchRecipes(filters)      // Get all recipes
fetchRecipe(id)            // Get single recipe
fetchFavoriteRecipes()     // Get favorites
fetchUserRecipes(userId)   // Get user's recipes
toggleFavorite(recipeId)   // Toggle favorite
fetchTags()                // Get all tags
```

### Add New API Function
```typescript
// In lib/recipe-api.ts
export async function newApiFunction(params) {
  const res = await fetch(`/api/endpoint?${params}`);
  if (!res.ok) throw new Error('Failed');
  return res.json();
}

// Use in component
const { data } = useQuery({
  queryKey: ['key', params],
  queryFn: () => newApiFunction(params),
});
```

## Styling Tips

### Use Existing Components
```typescript
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
```

### Responsive Grid
```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
  {items.map(item => <Card key={item.id}>...</Card>)}
</div>
```

### Loading State
```typescript
{isLoading ? (
  <Skeleton className="h-48 w-full" />
) : (
  <YourContent />
)}
```

## Debugging

### Check React Query Cache
```typescript
// In component
import { useQueryClient } from '@tanstack/react-query';
const queryClient = useQueryClient();

// Log cache
console.log(queryClient.getQueryData(['recipes']));

// Invalidate cache
queryClient.invalidateQueries(['recipes']);
```

### Check Network Requests
1. Open DevTools → Network tab
2. Filter by "Fetch/XHR"
3. Look for `/api/recipes` calls
4. Check status codes and responses

### Common Issues

**Problem**: Recipes not loading  
**Solution**: Check API endpoint, auth token, CORS

**Problem**: Types not matching  
**Solution**: Ensure using `Recipe` from `@/types/recipe`

**Problem**: State not updating  
**Solution**: Check React Query cache invalidation

## Performance Tips

### Optimize Images
```typescript
<Image
  src={recipe.imageUrl}
  alt={recipe.title}
  width={400}
  height={300}
  loading="lazy"
/>
```

### Debounce Search
```typescript
import { useDebouncedValue } from '@/hooks/use-debounced-value';

const debouncedQuery = useDebouncedValue(searchQuery, 300);
```

### Memo Expensive Calculations
```typescript
const sortedRecipes = useMemo(() => {
  return recipes.sort(...);
}, [recipes, sortBy]);
```

## Testing

### Test Recipe Browser
```typescript
// Check search works
1. Type in search box
2. Verify results update
3. Check loading state
4. Check empty state

// Check filters work
1. Apply tag filter
2. Verify results update
3. Check active badges
4. Click clear
```

### Test Recipe Drawer
```typescript
// Check drawer opens
1. Click recipe card
2. Verify drawer slides in
3. Check all data displays
4. Test all buttons

// Check drawer closes
1. Click X button
2. Click outside
3. Press Escape
4. Verify URL updates
```

## Hot Reload Tips

### Quick Changes
- Component edits: Auto-refresh
- Type changes: May need restart
- API changes: Restart dev server

### Force Refresh
```bash
# Clear cache and restart
rm -rf .next
npm run dev
```

## Useful Commands

```bash
# Development
npm run dev

# Build
npm run build

# Type check
npm run type-check

# Lint
npm run lint

# Format
npm run format
```

## Resources

### Documentation
- `RECIPE-HUB-PHASE-1-COMPLETE.md` - Phase 1 details
- `RECIPE-HUB-PHASE-2-COMPLETE.md` - Phase 2 details
- `RECIPE-HUB-QUICK-REFERENCE.md` - Quick reference
- `RECIPE-HUB-SUMMARY.md` - Overall summary

### External Docs
- [React Query](https://tanstack.com/query/latest)
- [shadcn/ui](https://ui.shadcn.com)
- [Next.js](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)

## Quick Wins

### Easy Additions
1. Add keyboard shortcuts (Cmd+K for search)
2. Add recipe count to tabs
3. Add "Back to top" button
4. Add recipe preview on hover
5. Add loading progress bar

### 5-Minute Features
1. Add sort by popularity
2. Add filter by prep time
3. Add "Recently added" badge
4. Add recipe difficulty icons
5. Add estimated cost

---

**Happy Coding! 🎉**  
**Need help? Check the full documentation →**
