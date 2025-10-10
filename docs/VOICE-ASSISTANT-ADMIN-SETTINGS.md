# Voice Assistant Admin Settings

## Overview

The Voice Assistant Admin Settings feature allows Super Admins to configure and fine-tune the AI parameters used by the cooking voice assistant, similar to the OpenAI platform playground.

## Location

**Admin Dashboard** → **System Settings** → **Voice Assistant Configuration**

URL: `/admin/settings`

## Features

### Configurable Parameters

#### 1. **Model Selection**
- Choose between different OpenAI models
- Options: GPT-4 Turbo (recommended), GPT-4, GPT-3.5 Turbo
- Impact: Response quality and speed

#### 2. **Temperature** (0.0 - 2.0)
- Controls randomness in responses
- Lower values (0.0-0.5): More focused and deterministic
- Medium values (0.6-1.0): Balanced creativity and accuracy
- Higher values (1.0-2.0): More creative and varied responses
- Default: 0.7

#### 3. **Max Tokens** (50 - 2000)
- Maximum length of AI responses
- Controls verbosity and API costs
- Default: 500 tokens (optimal for voice responses)

#### 4. **Top P / Nucleus Sampling** (0.0 - 1.0)
- Alternative to temperature for controlling diversity
- Lower values = more focused responses
- Higher values = more diverse responses
- Default: 1.0

#### 5. **Frequency Penalty** (-2.0 to 2.0)
- Reduces repetition of token sequences
- Positive values decrease likelihood of repeating the same line
- Negative values encourage repetition
- Default: 0.0

#### 6. **Presence Penalty** (-2.0 to 2.0)
- Encourages the model to talk about new topics
- Positive values increase likelihood of introducing new subjects
- Negative values make the model stick to current topics
- Default: 0.0

#### 7. **Response Max Length** (50 - 300 words)
- Suggested word limit mentioned in system prompt
- Helps keep voice responses concise
- Default: 100 words

#### 8. **System Prompt**
- Defines the assistant's personality and behavior
- Customizable instructions for how the AI should respond
- Can include specific guidelines, tone, focus areas

## How to Use

### Accessing Settings

1. Log in as a Super Admin
2. Navigate to Admin Dashboard
3. Click "System Settings"
4. You'll see the Voice Assistant Configuration panel

### Adjusting Parameters

1. **Modify sliders** for numerical parameters
2. **Select model** from dropdown
3. **Edit system prompt** in the text area
4. Click **"Save Settings"** to apply changes
5. Use **"Reset to Defaults"** to revert all changes

### Testing Changes

After saving settings:

1. Navigate to any recipe page
2. Click the voice assistant button (microphone icon)
3. Ask a cooking question
4. Observe the response quality
5. Return to settings to fine-tune if needed

## Settings Storage

- All settings are stored in the `SystemSetting` table in the database
- Settings are cached for 5 minutes to reduce database queries
- Changes apply immediately to all users system-wide

## Security & Permissions

- **Only Super Admins** can access and modify these settings
- All changes are logged in the Audit Log
- Includes: timestamp, admin user, and changed values

## API Endpoints

### GET `/api/admin/settings/voice-assistant`
Fetches current voice assistant settings

**Auth Required:** Yes (Super Admin only)

**Response:**
```json
{
  "success": true,
  "data": {
    "model": "gpt-4-turbo",
    "temperature": 0.7,
    "maxTokens": 500,
    "topP": 1.0,
    "frequencyPenalty": 0.0,
    "presencePenalty": 0.0,
    "systemPrompt": "You are Chef Assistant...",
    "responseMaxLength": 100
  }
}
```

### POST `/api/admin/settings/voice-assistant`
Updates voice assistant settings

**Auth Required:** Yes (Super Admin only)

**Request Body:**
```json
{
  "model": "gpt-4-turbo",
  "temperature": 0.8,
  "maxTokens": 600,
  "topP": 1.0,
  "frequencyPenalty": 0.0,
  "presencePenalty": 0.0,
  "systemPrompt": "Custom prompt...",
  "responseMaxLength": 120
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Settings updated successfully"
  }
}
```

## Recommended Configurations

### Conservative (Safe & Consistent)
```
Temperature: 0.5
Top P: 0.9
Frequency Penalty: 0.2
Presence Penalty: 0.0
Max Tokens: 400
```
Best for: Food safety questions, precise measurements

### Balanced (Default)
```
Temperature: 0.7
Top P: 1.0
Frequency Penalty: 0.0
Presence Penalty: 0.0
Max Tokens: 500
```
Best for: General cooking questions, recipes

### Creative (Varied & Interesting)
```
Temperature: 0.9
Top P: 1.0
Frequency Penalty: 0.3
Presence Penalty: 0.3
Max Tokens: 600
```
Best for: Recipe suggestions, creative substitutions

## Files Created/Modified

### New Files
1. `/src/app/admin/settings/page.tsx` - Admin settings UI
2. `/src/app/api/admin/settings/voice-assistant/route.ts` - API handlers
3. `/src/lib/voice-assistant-settings.ts` - Settings utility functions
4. `/docs/VOICE-ASSISTANT-ADMIN-SETTINGS.md` - This documentation

### Modified Files
1. `/src/app/api/cooking-assistant/route.ts` - Now uses configurable settings

## Technical Details

### Caching Strategy
- Settings are cached in memory for 5 minutes
- Reduces database load
- Balance between performance and update frequency
- Cache automatically cleared when settings are updated

### Database Schema
Settings stored in `SystemSetting` table:
```prisma
model SystemSetting {
  id          String   @id @default(cuid())
  key         String   @unique
  value       String
  category    String   // "AI"
  description String?
  dataType    String   // "string" or "number"
  isPublic    Boolean  // false (admin-only)
  updatedBy   String
  updatedAt   DateTime
  createdAt   DateTime
}
```

### Audit Logging
Every settings change creates an audit log entry:
```typescript
{
  action: "UPDATE",
  entityType: "VoiceAssistantSettings",
  entityId: "voice_assistant_config",
  userId: adminUserId,
  changes: { /* settings diff */ },
  ipAddress: requestIp,
  userAgent: userAgent
}
```

## Troubleshooting

### Settings Not Applying
1. Check browser console for errors
2. Verify you're logged in as Super Admin
3. Try clearing the cache (wait 5 minutes or restart server)

### Performance Issues
- Reduce `maxTokens` to speed up responses
- Consider using GPT-3.5 Turbo for faster (but less accurate) responses

### Quality Issues
- Increase temperature for more varied responses
- Decrease temperature for more focused responses
- Adjust system prompt for specific behaviors

## Future Enhancements

Potential improvements:
- [ ] Per-user settings overrides
- [ ] A/B testing different configurations
- [ ] Analytics on response quality
- [ ] Voice-specific parameters (speed, pitch)
- [ ] Multi-language support
- [ ] Response history and analytics
- [ ] Real-time preview of settings

## Support

For issues or questions:
1. Check audit logs for recent changes
2. Review OpenAI API status
3. Test with default settings
4. Check console logs for API errors
