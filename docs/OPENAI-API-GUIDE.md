# OpenAI API Integration - Complete Guide

## Overview

Your application now uses **user-specific OpenAI API keys** with automatic fallback to system keys. This means:
- Each user can configure their own OpenAI API key
- If a user hasn't set a key, the system uses the global `OPENAI_API_KEY` from environment variables
- All AI features (cooking assistant, recipe transcription, etc.) route through ChatGPT
- Better security, cost control, and quota management

---

## API Routes Using OpenAI

### 1. `/api/cooking-assistant` ✅ UPDATED
**Purpose:** Voice-activated cooking assistant
**Model:** GPT-4 Turbo (configurable)
**Features:**
- Cooking technique guidance
- Ingredient substitutions
- Recipe modifications
- Food safety advice
- Temperature/timing help

**Usage:**
```typescript
POST /api/cooking-assistant
{
  "question": "How do I substitute butter in cookies?",
  "context": "Baking chocolate chip cookies" // optional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "answer": "You can substitute butter with...",
    "context": "Baking chocolate chip cookies",
    "fallback": false
  }
}
```

---

### 2. `/api/transcribe` ✅ UPDATED
**Purpose:** OCR for recipe images (handwritten or printed)
**Model:** GPT-4 Turbo with Vision
**Features:**
- Extract recipes from photos
- Handle handwritten recipes
- Structure data automatically
- Confidence scoring

**Usage:**
```typescript
POST /api/transcribe
Content-Type: multipart/form-data

{
  "file": <Image File>,
  "isHandwritten": "true" // or "false"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "title": "Grandma's Chocolate Chip Cookies",
    "ingredients": ["2 cups flour", "1 cup butter", ...],
    "instructions": ["Preheat oven to 350°F", ...],
    "additionalInfo": {
      "servingSize": "24 cookies",
      "cookTime": "12 minutes",
      "prepTime": "15 minutes"
    },
    "confidence": 8,
    "isHandwritten": true
  }
}
```

---

### 3. `/api/recipes` ✅ NEW
**Purpose:** Manage user recipes
**Methods:** GET, POST

**GET /api/recipes:**
Retrieves all recipes for authenticated user
```json
{
  "success": true,
  "data": [
    {
      "id": "recipe_id",
      "title": "Recipe Name",
      "ingredients": [...],
      "instructions": [...],
      ...
    }
  ]
}
```

**POST /api/recipes:**
Creates a new recipe
```json
{
  "title": "My Recipe",
  "slug": "my-recipe",
  "contributor": "Chef Name",
  "ingredients": ["ingredient 1", ...],
  "instructions": ["step 1", ...],
  "tags": ["tag1", "tag2"],
  "summary": "Recipe description",
  "imageUrl": "https://...",
  "imageHint": "Descriptive text"
}
```

---

### 4. `/api/meal-plans` (No OpenAI - Database only)
**Purpose:** Manage meal plans
**Methods:** GET, POST, DELETE
**Note:** Does not use OpenAI - pure database operations

---

### 5. `/api/weather` (No OpenAI - External API)
**Purpose:** Weather-based recipe recommendations
**Note:** Uses external weather API, not OpenAI

---

## User API Key Configuration

### Setting Up Your OpenAI API Key

**Method 1: Through UI (Recommended)**
1. Go to Settings page (`/settings`)
2. Scroll to "API Configuration"
3. Enter your OpenAI API key (starts with `sk-`)
4. Click Save

**Method 2: Admin Setup Script**
```bash
npm run tsx scripts/add-admin-api-key.ts
```

---

## How User Keys Work

### Key Priority System
```
1. User's personal OpenAI key (from database)
   ↓ (if not set)
2. System OpenAI key (from OPENAI_API_KEY env var)
   ↓ (if not set)
3. Error: No API key available
```

### Key Storage
- Keys are **encrypted** in the database using AES-256-GCM
- Encryption key stored in `API_KEY_ENCRYPTION_SECRET` environment variable
- Only the last 4 characters are shown in UI (e.g., `****xyz4`)

### Key Retrieval Flow
```typescript
// In any API route:
import { createUserOpenAI } from '@/lib/openai-utils';

// Get user's OpenAI client
const openaiClient = await createUserOpenAI(userId);

// Use it
const result = await generateText({
  model: openaiClient('gpt-4-turbo'),
  prompt: "Your prompt here"
});
```

---

## Utility Functions

### `createUserOpenAI(userId: string)`
Creates an OpenAI client instance with user's key or system fallback
```typescript
const client = await createUserOpenAI(user.id);
```

### `getUserOpenAIKey(userId: string)`
Gets decrypted API key for a user
```typescript
const apiKey = await getUserOpenAIKey(user.id);
```

### `hasValidOpenAIKey(userId: string)`
Checks if user has a valid key configured
```typescript
const hasKey = await hasValidOpenAIKey(user.id);
if (!hasKey) {
  // Prompt user to configure key
}
```

### `withRetry<T>(fn, maxRetries, delayMs)`
Wraps AI calls with automatic retry logic
```typescript
const result = await withRetry(() => generateText({
  model: client('gpt-4'),
  prompt: "..."
}), 3, 1000);
```

### `getModelName(requested?, default?)`
Get model name with environment override support
```typescript
const model = getModelName(undefined, 'gpt-4-turbo');
// Can be overridden by OPENAI_DEFAULT_MODEL env var
```

---

## Error Handling

### OpenAI-Specific Errors

```typescript
import { OpenAIError } from '@/lib/openai-utils';

try {
  // AI operation
} catch (error) {
  if (error instanceof OpenAIError) {
    switch (error.code) {
      case 'NO_KEY':
        // No API key configured
        break;
      case 'INVALID_KEY':
        // API key is invalid
        break;
      case 'QUOTA_EXCEEDED':
        // Rate limit or quota exceeded
        break;
      case 'API_ERROR':
        // Other API errors
        break;
    }
  }
}
```

### Fallback Responses

All AI endpoints provide fallback responses when the service fails:
- Cooking Assistant: Basic cooking tips
- Transcribe: Raw OCR attempt
- Other endpoints: Graceful degradation

---

## Environment Variables

### Required
```bash
# System-wide OpenAI key (fallback)
OPENAI_API_KEY=sk-...

# Encryption for user keys
API_KEY_ENCRYPTION_SECRET=your-secret-here
```

### Optional
```bash
# Override default model
OPENAI_DEFAULT_MODEL=gpt-3.5-turbo

# For development
OPENAI_LOG_REQUESTS=true
```

---

## Cost Management

### Per-User Tracking
The system includes hooks for usage tracking:
```typescript
await logOpenAIUsage(
  userId,
  modelName,
  inputTokens,
  outputTokens,
  estimatedCost
);
```

### Best Practices
1. **Use user keys**: Each user pays for their own usage
2. **Model selection**: Use GPT-3.5-Turbo for simple tasks
3. **Token limits**: Set max_tokens to prevent runaway costs
4. **Caching**: Cache common responses
5. **Rate limiting**: Implement per-user rate limits

---

## Security Considerations

### ✅ Implemented
- API key encryption (AES-256-GCM)
- User authentication required
- Admin-only key management
- Secure key display (masked)
- Environment variable separation

### 🔒 Recommendations
1. Rotate `API_KEY_ENCRYPTION_SECRET` periodically
2. Use different keys for dev/staging/production
3. Monitor for unusual usage patterns
4. Implement per-user rate limiting
5. Set up billing alerts in OpenAI dashboard

---

## Testing API Endpoints

### Using cURL

**Cooking Assistant:**
```bash
curl -X POST https://your-domain.com/api/cooking-assistant \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION" \
  -d '{
    "question": "How do I check if chicken is cooked?",
    "context": "Grilling chicken breast"
  }'
```

**Transcribe Recipe:**
```bash
curl -X POST https://your-domain.com/api/transcribe \
  -H "Cookie: next-auth.session-token=YOUR_SESSION" \
  -F "file=@recipe-image.jpg" \
  -F "isHandwritten=false"
```

---

## Migration Guide

### From System Keys to User Keys

**Step 1: Configure User Keys**
Users should add their API keys in Settings:
```
Settings → API Configuration → OpenAI API Key
```

**Step 2: System Fallback**
The system automatically falls back to `OPENAI_API_KEY` if user hasn't configured their key.

**Step 3: Gradual Migration**
- No immediate action required
- Users can migrate at their own pace
- System key remains as safety net

---

## Troubleshooting

### "No OpenAI API key available"
**Solution:** 
- User: Add your API key in Settings
- Admin: Ensure `OPENAI_API_KEY` is set in environment

### "Invalid API key"
**Solution:**
- Verify key starts with `sk-`
- Check key hasn't been revoked
- Test key in OpenAI Playground

### "Rate limit exceeded"
**Solution:**
- Wait before retrying
- User should check their OpenAI quota
- Consider upgrading OpenAI plan

### Decryption errors
**Solution:**
- Ensure `API_KEY_ENCRYPTION_SECRET` matches the one used to encrypt
- Re-encrypt keys if secret was changed

---

## Future Enhancements

### Planned Features
- [ ] Usage analytics dashboard
- [ ] Per-user rate limiting
- [ ] Cost estimation before calls
- [ ] Model selection in UI
- [ ] Shared team keys
- [ ] Webhook for quota warnings
- [ ] Automatic key validation
- [ ] Usage reports

---

## API Reference

### Models Available
- `gpt-4-turbo` - Best quality, higher cost
- `gpt-4` - Standard GPT-4
- `gpt-3.5-turbo` - Fast, economical
- `gpt-4-vision-preview` - For image analysis

### Token Estimates
- Cooking question: ~200-500 tokens
- Recipe transcription: ~1000-3000 tokens
- Simple chat: ~100-300 tokens

### Rate Limits (OpenAI)
- GPT-4: 10,000 tokens/min
- GPT-3.5-Turbo: 90,000 tokens/min
- Requests per minute varies by plan

---

## Support

### Common Questions

**Q: Can I use different keys for different features?**
A: Currently one key per user, but we can extend this if needed.

**Q: What happens if my key quota runs out?**
A: The system falls back to system key, or shows user-friendly error.

**Q: Are my API keys secure?**
A: Yes, encrypted with AES-256-GCM and never exposed in logs.

**Q: Can I share my key with team members?**
A: Not recommended. Each user should have their own key for tracking.

---

## Summary

✅ **What Changed:**
- All OpenAI calls now use user-specific keys
- Automatic fallback to system key
- Encrypted key storage
- Better error handling
- Cost control per user

✅ **What Works:**
- Cooking assistant with ChatGPT
- Recipe OCR with GPT-4 Vision
- Voice commands
- All existing features

✅ **Next Steps:**
1. Users add their keys in Settings
2. Monitor usage in OpenAI dashboard
3. Implement rate limiting if needed
4. Consider usage analytics

---

**Last Updated:** $(date)
**Version:** 2.0 - User-Specific API Keys
