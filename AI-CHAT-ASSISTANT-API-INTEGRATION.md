# AI Chat Assistant - API Integration Guide

## Current Implementation

The chat assistant currently uses a **rule-based response system** (placeholder). This allows the UI to function immediately while you integrate your preferred AI service.

## Integration Options

### Option 1: OpenAI GPT-4 (Recommended)

#### Setup
```bash
npm install openai
```

#### Environment Variables
```env
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4-turbo-preview
```

#### Implementation
Create `/src/app/api/chat/route.ts`:

```typescript
import { OpenAI } from 'openai';
import { NextRequest, NextResponse } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { message, history, weather } = await request.json();

    const systemPrompt = `You are a helpful AI cooking assistant. You help users with:
- Recipe suggestions and modifications
- Cooking techniques and tips
- Meal planning and nutrition
- Ingredient substitutions
- Kitchen conversions and measurements
${weather ? `\nCurrent weather: ${weather.temperature}°F, ${weather.condition}` : ''}

Be friendly, concise, and practical. Provide specific, actionable advice.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.map((msg: any) => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.text
      })),
      { role: 'user', content: message }
    ];

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
      messages,
      temperature: 0.7,
      max_tokens: 500,
    });

    return NextResponse.json({
      message: response.choices[0].message.content
    });
  } catch (error) {
    console.error('OpenAI API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    );
  }
}
```

#### Update Component
In `ai-chat-assistant.tsx`, replace `generateAIResponse`:

```typescript
const handleSendMessage = async (text?: string) => {
  const messageText = text || inputText.trim();
  if (!messageText) return;

  const userMessage: Message = {
    id: Date.now().toString(),
    type: 'user',
    text: messageText,
    timestamp: new Date()
  };

  setMessages(prev => [...prev, userMessage]);
  setInputText('');
  setIsTyping(true);

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: messageText,
        history: messages.slice(-10), // Last 10 messages for context
        weather
      })
    });

    const data = await response.json();

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      type: 'assistant',
      text: data.message,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, assistantMessage]);

    if (audioEnabled) {
      speakText(data.message);
    }
  } catch (error) {
    console.error('Failed to get AI response:', error);
    const errorMessage: Message = {
      id: (Date.now() + 1).toString(),
      type: 'assistant',
      text: "I'm sorry, I'm having trouble connecting right now. Please try again.",
      timestamp: new Date()
    };
    setMessages(prev => [...prev, errorMessage]);
  } finally {
    setIsTyping(false);
  }
};
```

---

### Option 2: Anthropic Claude

#### Setup
```bash
npm install @anthropic-ai/sdk
```

#### Environment Variables
```env
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-3-sonnet-20240229
```

#### API Route (`/src/app/api/chat/route.ts`)
```typescript
import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { message, history, weather } = await request.json();

    const systemPrompt = `You are a helpful AI cooking assistant specialized in recipes, meal planning, and culinary techniques.
${weather ? `Current weather: ${weather.temperature}°F, ${weather.condition}` : ''}`;

    const messages = history.map((msg: any) => ({
      role: msg.type === 'user' ? 'user' : 'assistant',
      content: msg.text
    }));
    
    messages.push({ role: 'user', content: message });

    const response = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL || 'claude-3-sonnet-20240229',
      max_tokens: 500,
      system: systemPrompt,
      messages,
    });

    return NextResponse.json({
      message: response.content[0].text
    });
  } catch (error) {
    console.error('Claude API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    );
  }
}
```

---

### Option 3: Local AI (Ollama)

#### Setup
```bash
# Install Ollama from https://ollama.ai
ollama pull llama2
ollama serve
```

#### Implementation
```typescript
// No API key needed - runs locally
export async function POST(request: NextRequest) {
  try {
    const { message, history, weather } = await request.json();

    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama2',
        prompt: `You are a cooking assistant. ${message}`,
        stream: false,
      })
    });

    const data = await response.json();

    return NextResponse.json({
      message: data.response
    });
  } catch (error) {
    console.error('Ollama API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    );
  }
}
```

---

### Option 4: Azure OpenAI

#### Setup
```bash
npm install @azure/openai
```

#### Environment Variables
```env
AZURE_OPENAI_API_KEY=...
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT=your-deployment-name
```

#### Implementation
```typescript
import { OpenAIClient, AzureKeyCredential } from "@azure/openai";

const client = new OpenAIClient(
  process.env.AZURE_OPENAI_ENDPOINT!,
  new AzureKeyCredential(process.env.AZURE_OPENAI_API_KEY!)
);

export async function POST(request: NextRequest) {
  const { message, history, weather } = await request.json();

  const messages = [
    { role: 'system', content: 'You are a cooking assistant...' },
    ...history.map((msg: any) => ({
      role: msg.type === 'user' ? 'user' : 'assistant',
      content: msg.text
    })),
    { role: 'user', content: message }
  ];

  const result = await client.getChatCompletions(
    process.env.AZURE_OPENAI_DEPLOYMENT!,
    messages
  );

  return NextResponse.json({
    message: result.choices[0].message?.content
  });
}
```

---

## Advanced Features

### 1. Streaming Responses

For real-time AI responses (like ChatGPT):

```typescript
// API Route with streaming
export async function POST(request: NextRequest) {
  const { message, history } = await request.json();

  const stream = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [...history, { role: 'user', content: message }],
    stream: true,
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        controller.enqueue(encoder.encode(content));
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: { 'Content-Type': 'text/event-stream' }
  });
}

// Component update
const handleSendMessage = async (text?: string) => {
  // ... user message setup ...

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: messageText, history: messages })
    });

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let fullText = '';

    // Create assistant message that will be updated
    const assistantId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, {
      id: assistantId,
      type: 'assistant',
      text: '',
      timestamp: new Date()
    }]);

    while (true) {
      const { done, value } = await reader!.read();
      if (done) break;

      const chunk = decoder.decode(value);
      fullText += chunk;

      // Update the message in real-time
      setMessages(prev => prev.map(msg =>
        msg.id === assistantId ? { ...msg, text: fullText } : msg
      ));
    }

    setIsTyping(false);
  } catch (error) {
    console.error('Streaming error:', error);
  }
};
```

### 2. Recipe Database Integration

Connect AI responses to your recipe database:

```typescript
// API Route
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  const { message } = await request.json();

  // Check if user is asking about recipes
  if (message.toLowerCase().includes('recipe')) {
    // Search your database
    const recipes = await prisma.recipe.findMany({
      where: {
        OR: [
          { title: { contains: message, mode: 'insensitive' } },
          { description: { contains: message, mode: 'insensitive' } }
        ]
      },
      take: 3
    });

    if (recipes.length > 0) {
      const recipeList = recipes.map(r => 
        `- [${r.title}](/recipes/${r.id})`
      ).join('\n');

      return NextResponse.json({
        message: `I found these recipes for you:\n\n${recipeList}\n\nWould you like to know more about any of these?`,
        recipes // Include for UI enhancement
      });
    }
  }

  // Otherwise, use AI
  const aiResponse = await openai.chat.completions.create({...});
  return NextResponse.json({ message: aiResponse.choices[0].message.content });
}
```

### 3. Context-Aware Responses

Enhance with user context:

```typescript
export async function POST(request: NextRequest) {
  const { message, userId } = await request.json();

  // Get user preferences
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      preferences: true,
      mealPlans: { take: 1, orderBy: { createdAt: 'desc' } }
    }
  });

  const contextPrompt = `
User dietary preferences: ${user?.preferences?.dietary || 'none'}
User skill level: ${user?.preferences?.skillLevel || 'intermediate'}
Recent meal plan: ${user?.mealPlans?.[0]?.meals || 'none'}
  `;

  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      { role: 'system', content: `You are a cooking assistant. ${contextPrompt}` },
      { role: 'user', content: message }
    ]
  });

  return NextResponse.json({ message: response.choices[0].message.content });
}
```

### 4. Voice Transcription (Whisper)

For more accurate voice-to-text:

```typescript
// API Route for voice transcription
import { OpenAI } from 'openai';

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const audioFile = formData.get('audio') as File;

  const transcription = await openai.audio.transcriptions.create({
    file: audioFile,
    model: 'whisper-1',
  });

  return NextResponse.json({ text: transcription.text });
}
```

---

## Cost Optimization

### 1. Rate Limiting
```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 requests per minute
});

export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  const { success } = await ratelimit.limit(userId || 'anonymous');

  if (!success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429 }
    );
  }

  // Continue with AI request...
}
```

### 2. Caching Common Responses
```typescript
import { kv } from '@vercel/kv';

export async function POST(request: NextRequest) {
  const { message } = await request.json();

  // Check cache first
  const cached = await kv.get(`chat:${message.toLowerCase()}`);
  if (cached) {
    return NextResponse.json({ message: cached, cached: true });
  }

  // Get AI response
  const response = await openai.chat.completions.create({...});
  const aiMessage = response.choices[0].message.content;

  // Cache for 1 hour
  await kv.set(`chat:${message.toLowerCase()}`, aiMessage, { ex: 3600 });

  return NextResponse.json({ message: aiMessage });
}
```

### 3. Token Optimization
```typescript
// Limit message history
const recentHistory = messages.slice(-10); // Only last 10 messages

// Trim long messages
const trimMessage = (text: string, maxTokens: number = 100) => {
  const words = text.split(' ');
  return words.slice(0, maxTokens).join(' ') + 
    (words.length > maxTokens ? '...' : '');
};

// Use cheaper models for simple queries
const useModel = message.length < 50 ? 'gpt-3.5-turbo' : 'gpt-4-turbo-preview';
```

---

## Testing

### Mock API for Development
```typescript
// api/chat/route.ts for development
export async function POST(request: NextRequest) {
  const { message } = await request.json();

  // Simulate AI delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Return mock response
  return NextResponse.json({
    message: `[MOCK] I received: "${message}". This is a test response.`
  });
}
```

---

## Security Considerations

1. **API Key Protection**: Never expose keys in client-side code
2. **Authentication**: Require user authentication for chat API
3. **Input Sanitization**: Validate and sanitize user messages
4. **Rate Limiting**: Prevent abuse and control costs
5. **Content Filtering**: Filter inappropriate content
6. **Error Handling**: Don't expose internal errors to users

---

## Monitoring

```typescript
// Add logging
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const response = await openai.chat.completions.create({...});

    // Log successful request
    console.log({
      type: 'chat_completion',
      duration: Date.now() - startTime,
      tokens: response.usage?.total_tokens,
      model: response.model
    });

    return NextResponse.json({ message: response.choices[0].message.content });
  } catch (error) {
    // Log error
    console.error({
      type: 'chat_error',
      duration: Date.now() - startTime,
      error: error.message
    });

    throw error;
  }
}
```

---

## Next Steps

1. Choose your AI provider (OpenAI recommended)
2. Set up environment variables
3. Create the API route
4. Update the component's `handleSendMessage` function
5. Test with various queries
6. Implement rate limiting and caching
7. Add monitoring and logging
8. Deploy and monitor costs

The current placeholder implementation allows you to develop and test the UI while you set up the AI integration at your own pace.
