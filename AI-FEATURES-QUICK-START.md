# AI Features Quick Start Guide 🤖

## Overview

Your meal planner now includes powerful AI features to make meal planning effortless:
- 🎯 Smart meal suggestions based on weather and preferences
- 💬 Natural language meal planning ("Add pasta for Tuesday")
- 🏷️ Automatic recipe tagging with AI
- 📊 Learning from your meal preferences

---

## Prerequisites

### OpenAI API Key Setup

All AI features require an OpenAI API key. Each user must configure their own key:

1. **Get an OpenAI API Key**:
   - Go to https://platform.openai.com/api-keys
   - Sign up or log in
   - Create a new API key
   - Copy the key (it starts with `sk-`)

2. **Add to Your Account**:
   - Navigate to Settings → API Keys
   - Paste your OpenAI API key
   - Click "Save"

**Note**: Your API key is encrypted and stored securely. You'll be charged by OpenAI based on usage.

---

## Feature 1: Smart Meal Suggestions 🎯

Get AI-powered meal recommendations based on weather, your preferences, and meal history.

### How to Use

#### In Code (React Component):

```tsx
import { SmartSuggestionsPanel } from '@/components/ai/smart-suggestions-panel';

<SmartSuggestionsPanel
  date={new Date('2025-01-15')}
  mealType="DINNER"
  weather={{
    temperature: 45,
    condition: 'rainy',
    precipitation: 80
  }}
  onSelectSuggestion={(suggestion) => {
    // Add the suggested meal to your calendar
    console.log('Selected:', suggestion.recipeName);
  }}
/>
```

#### Via API:

```bash
curl -X POST http://localhost:9002/api/ai/suggest-meals \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION" \
  -d '{
    "date": "2025-01-15T00:00:00Z",
    "mealType": "DINNER",
    "weather": {
      "temperature": 45,
      "condition": "rainy"
    },
    "includePreferences": true,
    "includeHistory": true
  }'
```

### What You Get

Each suggestion includes:
- **Recipe name**: e.g., "Hearty Beef Stew"
- **Reason**: Why it's suggested (e.g., "Perfect comfort food for cold, rainy weather")
- **Cuisine**: Italian, Mexican, Asian, etc.
- **Calories**: Per serving
- **Tags**: quick-meal, healthy, one-pot, etc.
- **Confidence score**: 0-1 (higher is more confident)
- **Reasoning**: Detailed explanation

### Example Response

```json
{
  "suggestions": [
    {
      "recipeName": "Hearty Beef Stew",
      "reason": "Perfect comfort food for cold, rainy weather",
      "cuisine": "American",
      "calories": 450,
      "tags": ["comfort-food", "one-pot", "warming"],
      "confidence": 0.92,
      "reasoning": "This warming stew is ideal for rainy weather at 45°F..."
    }
  ]
}
```

---

## Feature 2: Natural Language Meal Planning 💬

Plan meals by typing simple commands in plain English.

### Supported Commands

#### Add a Meal
```
"Add chicken stir fry for Tuesday dinner"
"Plan spaghetti carbonara for tomorrow"
"Add pancakes for Sunday breakfast"
```

#### Remove a Meal
```
"Remove lunch from tomorrow"
"Delete Tuesday dinner"
"Clear Friday breakfast"
```

#### Plan Multiple Meals
```
"Plan meals for next week"
"Generate a meal plan for this weekend"
```

### How to Use

#### In Code (React Component):

```tsx
import { NLPCommandInput } from '@/components/ai/nlp-command-input';

<NLPCommandInput
  placeholder="Try: 'Add pasta for Tuesday dinner'"
  onSuccess={(result) => {
    // Command was executed successfully
    console.log('Actions performed:', result.actions);
    // Refresh your meal plan view
  }}
/>
```

#### Via API:

```bash
curl -X POST http://localhost:9002/api/ai/nlp-plan \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION" \
  -d '{
    "command": "Add pasta for Tuesday dinner"
  }'
```

### Date Formats Supported

The AI understands many date formats:

- **Specific dates**: "January 15", "2025-01-15"
- **Relative dates**: "tomorrow", "next Tuesday", "in 3 days"
- **Date ranges**: "next week", "this weekend"

### Example Response

```json
{
  "success": true,
  "intent": "add_meal",
  "actions": [
    {
      "action": "add",
      "recipeName": "pasta",
      "date": "2025-01-16",
      "mealType": "DINNER"
    }
  ],
  "results": [
    {
      "action": "add",
      "success": true,
      "meal": { /* PlannedMeal object */ }
    }
  ]
}
```

### Clarification Questions

If the AI needs more information:

```json
{
  "success": false,
  "clarificationNeeded": true,
  "question": "Which recipe did you mean? I found multiple pasta recipes.",
  "parsed": { /* partial parse */ }
}
```

---

## Feature 3: Automatic Recipe Tagging 🏷️

Let AI analyze your recipes and generate comprehensive tags automatically.

### What Gets Tagged

The AI generates:
- **General tags**: comfort-food, healthy, quick-meal, one-pot
- **Meal types**: breakfast, lunch, dinner, snack
- **Dietary labels**: vegan, vegetarian, gluten-free, keto, paleo
- **Cuisines**: Italian, Mexican, Asian, Mediterranean
- **Cooking methods**: baked, grilled, fried, slow-cooked
- **Occasions**: weeknight-dinner, party, holiday
- **Seasons**: spring, summer, fall, winter
- **Nutrition**: low-calorie, high-protein, heart-healthy

### How to Use

#### In Code (React Component):

```tsx
import { AutoTagButton } from '@/components/ai/auto-tag-button';

<AutoTagButton
  recipeId={recipe.id}
  variant="outline"
  size="default"
  onTagsGenerated={(result) => {
    // Update your recipe with the new tags
    console.log('Generated tags:', result.tags);
    console.log('Suggested cuisine:', result.suggestedCuisine);
  }}
/>
```

#### Via API (Single Recipe):

```bash
curl -X POST http://localhost:9002/api/ai/auto-tag \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION" \
  -d '{
    "recipeId": "clx123abc",
    "autoApply": false
  }'
```

#### Via API (Batch Tag Multiple Recipes):

```bash
curl -X PUT http://localhost:9002/api/ai/auto-tag \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION" \
  -d '{
    "recipeIds": ["clx123", "clx456", "clx789"],
    "autoApply": true
  }'
```

### Example Response

```json
{
  "tags": [
    "comfort-food",
    "one-pot",
    "weeknight-dinner",
    "italian",
    "pasta",
    "make-ahead"
  ],
  "suggestedCuisine": "Italian",
  "suggestedCourse": "Main Course",
  "mealType": ["dinner", "lunch"],
  "dietaryLabels": ["vegetarian"],
  "difficulty": "Easy",
  "cookingMethod": ["boiled", "simmered"],
  "prepTime": "30 minutes",
  "nutritionProfile": "balanced",
  "seasonality": ["fall", "winter"],
  "confidence": 0.88
}
```

---

## Feature 4: Diet Preference Learning 📊

The AI learns from your meal planning history to improve suggestions over time.

### What It Learns

- **Favorite cuisines**: Based on frequency of selection
- **Calorie patterns**: Average calories per meal type
- **Common tags**: Most frequently used recipe tags
- **Meal timing**: Typical meal times
- **Dietary preferences**: Vegetarian, gluten-free tendencies
- **Weather preferences**: Hot vs. cold weather meal choices

### How It Works

The learning happens automatically:
1. Every 30 days of meal history is analyzed
2. Patterns are detected in your selections
3. Future suggestions are weighted based on learned preferences
4. No manual configuration required

### Viewing Learned Preferences

```typescript
import { analyzeUserPreferences } from '@/ai/flows/meal-suggestion-flow';

const preferences = await analyzeUserPreferences(userId);
// Returns:
// {
//   favoriteCuisines: ['italian', 'mexican', 'asian'],
//   avgCaloriesPerMeal: 450,
//   commonTags: ['quick-meal', 'healthy', 'one-pot'],
//   dietaryPatterns: ['vegetarian-friendly'],
// }
```

---

## Integration Examples

### Example 1: Meal Planning Page

```tsx
'use client';

import { useState } from 'react';
import { NLPCommandInput } from '@/components/ai/nlp-command-input';
import { SmartSuggestionsPanel } from '@/components/ai/smart-suggestions-panel';
import { useMealPlan } from '@/hooks/use-meal-plan';

export default function MealPlanningPage() {
  const { data: mealPlan, refetch } = useMealPlan();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedMealType, setSelectedMealType] = useState('DINNER');

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Meal Planning</h1>

      {/* Natural Language Input */}
      <div className="mb-8">
        <NLPCommandInput
          placeholder="Try: 'Add pasta for Tuesday dinner'"
          onSuccess={() => refetch()}
        />
      </div>

      {/* Smart Suggestions */}
      <SmartSuggestionsPanel
        date={selectedDate}
        mealType={selectedMealType}
        weather={weatherData}
        onSelectSuggestion={async (suggestion) => {
          // Add to calendar
          await addMealToCalendar(suggestion);
          refetch();
        }}
      />

      {/* Calendar view */}
      {/* ... */}
    </div>
  );
}
```

### Example 2: Recipe Editor

```tsx
'use client';

import { useState } from 'react';
import { AutoTagButton } from '@/components/ai/auto-tag-button';
import { Button } from '@/components/ui/button';

export function RecipeEditor({ recipe, onSave }) {
  const [tags, setTags] = useState(recipe.tags || []);
  const [cuisine, setCuisine] = useState(recipe.cuisine || '');

  return (
    <form onSubmit={handleSubmit}>
      {/* Recipe form fields */}
      <input name="title" defaultValue={recipe.title} />
      <textarea name="ingredients" defaultValue={recipe.ingredients} />
      <textarea name="instructions" defaultValue={recipe.instructions} />

      {/* Auto-tag button */}
      <div className="flex gap-2 mt-4">
        <AutoTagButton
          recipeId={recipe.id}
          variant="outline"
          onTagsGenerated={(result) => {
            setTags(result.tags);
            setCuisine(result.suggestedCuisine || cuisine);
          }}
        />
        <Button type="submit">Save Recipe</Button>
      </div>

      {/* Display current tags */}
      <div className="mt-4">
        <p className="text-sm font-medium mb-2">Current Tags:</p>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag, i) => (
            <span key={i} className="px-2 py-1 bg-gray-100 rounded">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </form>
  );
}
```

---

## Performance Tips

### 1. Caching

AI responses are cached by React Query:
- **Suggestions**: 5 minutes
- **Auto-tag results**: 10 minutes
- **NLP commands**: Not cached (always fresh)

### 2. Rate Limits

Be aware of rate limits:
- **Suggestions**: 10 requests/minute
- **NLP commands**: 20 requests/minute
- **Auto-tagging**: 30 single / 5 batch per minute

### 3. Batch Operations

For tagging multiple recipes, use batch endpoint:

```typescript
import { useBatchAutoTag } from '@/hooks/use-auto-tag';

const batchTag = useBatchAutoTag();
await batchTag.mutateAsync({
  recipeIds: ['clx1', 'clx2', 'clx3', 'clx4', 'clx5'],
  autoApply: true,
});
```

---

## Troubleshooting

### "OpenAI API key not configured"

**Solution**: Add your OpenAI API key in Settings → API Keys

### "Failed to generate suggestions"

**Possible causes**:
1. No OpenAI API key configured
2. Rate limit exceeded
3. Network connectivity issues
4. OpenAI API outage

**Solution**: Check your API key, wait a moment, and try again

### "Recipe not found" (NLP planning)

**Cause**: The AI couldn't find a recipe matching your command

**Solution**: Be more specific with recipe names, or create the recipe first

### Low confidence scores

**Cause**: Limited meal history or unclear preferences

**Solution**: Continue using the app to build meal history for better suggestions

---

## Cost Estimation

OpenAI API costs (approximate):

- **Smart suggestions**: $0.01-0.03 per request (GPT-4-turbo)
- **NLP parsing**: $0.01-0.02 per command
- **Auto-tagging**: $0.01 per recipe

**Monthly estimate**: $5-15 for typical usage (50-100 AI requests)

**Tips to reduce costs**:
- Use cached suggestions when possible
- Batch tag recipes instead of one-by-one
- Rely on learned preferences (they improve over time)

---

## API Reference

### POST /api/ai/suggest-meals

Generate smart meal suggestions.

**Request**:
```json
{
  "date": "2025-01-15T00:00:00Z",
  "mealType": "DINNER",
  "weather": {
    "temperature": 45,
    "condition": "rainy",
    "precipitation": 80
  },
  "includePreferences": true,
  "includeHistory": true
}
```

**Response**: `{ suggestions: MealSuggestion[] }`

---

### POST /api/ai/nlp-plan

Parse and execute NLP command.

**Request**:
```json
{
  "command": "Add pasta for Tuesday dinner"
}
```

**Response**: `NLPPlanResult`

---

### POST /api/ai/auto-tag

Auto-tag a single recipe.

**Request**:
```json
{
  "recipeId": "clx123",
  "autoApply": false
}
```

**Response**: `AutoTagResult`

---

### PUT /api/ai/auto-tag

Batch auto-tag multiple recipes.

**Request**:
```json
{
  "recipeIds": ["clx1", "clx2", "clx3"],
  "autoApply": true
}
```

**Response**: `{ success: true, results: AutoTagResult[], count: number }`

---

## Next Steps

1. **Configure your OpenAI API key** in Settings
2. **Try natural language planning**: "Add pizza for Friday dinner"
3. **Get smart suggestions** for tonight's dinner
4. **Auto-tag your recipes** to improve searchability
5. **Let the AI learn** from your meal choices over time

---

## Support

For issues or questions:
- Check the full documentation: `docs/PHASE-4C-AI-FEATURES-COMPLETE.md`
- Review API implementation: `src/app/api/ai/`
- Test with example commands in this guide

**Happy meal planning! 🍽️🤖**
