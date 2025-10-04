# AI Voice Assistant Setup Guide

## Overview
The AI Voice Assistant provides intelligent, hands-free cooking assistance using voice commands. It integrates with OpenAI's GPT-4 for natural language understanding and contextual help.

## Features

### ✅ Implemented
- **Weather-Based Recipe Suggestions**: "What should I cook today?"
- **Voice-Activated Timers**: "Set timer for 15 minutes"
- **Recipe Reading**: "Read ingredients" or "Read instructions"
- **Unit Conversions**: "Convert 2 cups to tablespoons"
- **AI-Powered Cooking Questions**: "How do I caramelize onions?" or "What can I substitute for butter?"
- **Shopping List Management**: "Add milk to shopping list"
- **Unit Preference Switching**: "Switch to metric"
- **General Cooking Tips**: Ask any cooking-related question

### 🎤 Voice Commands

#### Recipe Suggestions
- "What should I cook today?"
- "Give me recipe suggestions"
- "What should I make?"

#### Timers
- "Set timer for 15 minutes"
- "Set a 30 minute timer for pasta"

#### Recipe Navigation
- "Read the ingredients"
- "Read the instructions"
- "Read the recipe"

#### Conversions
- "How many tablespoons in a cup?"
- "Convert 2 cups of flour to grams"
- "Convert 350 fahrenheit to celsius"
- "How many teaspoons in a tablespoon?"

#### Cooking Questions (AI-Powered)
- "How do I caramelize onions?"
- "What can I substitute for butter?"
- "How long should I boil eggs?"
- "What is the difference between baking and roasting?"
- "Can I use olive oil instead of vegetable oil?"

#### Shopping List
- "Add milk to shopping list"
- "Add eggs and butter to shopping list"
- "What's on my shopping list?"
- "Read my shopping list"

#### Unit Preferences
- "Switch to metric"
- "Switch to imperial"
- "Change units to metric"

## Setup Instructions

### 1. Install Dependencies
Dependencies are already installed. The project uses:
- `@ai-sdk/openai` - AI SDK for OpenAI integration
- `ai` - Vercel AI SDK

### 2. Configure OpenAI API Key

Create a `.env.local` file in the project root (already created):

```env
OPENAI_API_KEY=your_openai_api_key_here
```

**Get your API key:**
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign in or create an account
3. Navigate to "API keys"
4. Click "Create new secret key"
5. Copy the key (starts with `sk-`)
6. Replace `your_openai_api_key_here` in `.env.local`

### 3. Restart Development Server

After adding your API key:
```bash
npm run dev
```

## Usage

### Opening the Assistant
1. Click the floating orange chat button in the bottom-right corner
2. Or click "Start Voice Assistant" from the minimized widget

### Using Voice Commands
1. Click "Start Listening" to activate voice recognition
2. Speak your command clearly
3. The assistant will process and respond with voice output
4. It will automatically start listening again after speaking

### Quick Actions
- Click "🌤️ Get Recipe Suggestions" for weather-based recipe ideas
- The assistant shows the last 5 messages in the conversation
- Current transcript appears while you're speaking

## Browser Compatibility

### Web Speech API Support
- ✅ **Chrome/Edge**: Full support
- ✅ **Safari**: Full support
- ⚠️ **Firefox**: Limited support (may need to enable in flags)

### Required Permissions
- **Microphone Access**: Required for voice input
- **HTTPS**: Required in production (works on localhost)

## API Endpoint

### `/api/cooking-assistant`

**Request:**
```typescript
{
  question: string;
  context?: string; // e.g., "Currently cooking: Pasta Carbonara"
}
```

**Response:**
```typescript
{
  answer: string;
  context?: string;
  fallback?: boolean;
}
```

## Customization

### Voice Settings
Located in `voice-assistant.tsx`:
```typescript
const voiceSettings = {
  voice: null, // Auto-selects best available voice
  rate: 0.9,   // Speech rate (0.1 - 10)
  pitch: 1.0,  // Voice pitch (0 - 2)
  volume: 0.8  // Volume (0 - 1)
};
```

### AI Model Configuration
Located in `/api/cooking-assistant/route.ts`:
```typescript
model: openai('gpt-4-turbo')  // Can change to gpt-3.5-turbo for faster/cheaper responses
temperature: 0.7              // Creativity level (0 = focused, 1 = creative)
max_tokens: 150              // Max response length
```

## Troubleshooting

### "I don't hear the assistant speaking"
- Check browser audio permissions
- Verify volume settings
- Try clicking the speaker button to test audio
- Check that `speechSynthesis` is supported: Open browser console and type `window.speechSynthesis`

### "The assistant doesn't recognize my voice"
- Check microphone permissions in browser
- Speak clearly and at a normal pace
- Reduce background noise
- Try restarting the browser

### "API errors or no AI responses"
- Verify `OPENAI_API_KEY` is set in `.env.local`
- Ensure the API key is valid (starts with `sk-`)
- Check OpenAI account has available credits
- Restart the development server after adding the key

### "No weather suggestions"
- Weather data must be passed to the component via the `weather` prop
- Check that weather API is functioning
- Fallback suggestions are provided if weather is unavailable

## Development

### File Structure
```
src/
  components/
    voice-assistant.tsx          # Main voice assistant component
  app/
    api/
      cooking-assistant/
        route.ts                 # AI API endpoint
```

### Testing Commands
Open the voice assistant and try:
1. "What should I cook today?" → Weather-based suggestion
2. "Set timer for 5 minutes" → Timer functionality
3. "How many cups in a liter?" → Unit conversion
4. "How do I dice an onion?" → AI cooking help
5. "Add eggs to shopping list" → Shopping list management

## Future Enhancements

### Planned Features
- [ ] Recipe step-by-step navigation ("Next step", "Previous step")
- [ ] Multi-language support
- [ ] Voice-controlled recipe search
- [ ] Cooking technique videos on demand
- [ ] Personalized cooking tips based on history
- [ ] Integration with smart home devices

## Cost Considerations

### OpenAI API Usage
- Each voice query costs approximately $0.001-0.003 (GPT-4 Turbo)
- ~150 tokens per response
- Budget: ~$10 = ~5,000 queries
- Consider using GPT-3.5-turbo for lower costs (~10x cheaper)

### Rate Limits
- Free tier: 3 RPM (requests per minute)
- Paid tier: 500+ RPM depending on plan
- Caching and fallback responses help reduce API calls

## Support

For issues or feature requests:
1. Check this documentation first
2. Review browser console for errors
3. Verify API key and configuration
4. Test with simple commands first

---

**Happy Cooking! 🍳👨‍🍳**
