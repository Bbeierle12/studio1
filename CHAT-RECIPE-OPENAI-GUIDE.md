# Chat Recipe Creator - OpenAI Integration Guide

## 🤖 Upgrading to Real AI Conversations

Currently, the chat interface uses a simple state machine for conversations. Here's how to integrate OpenAI for truly intelligent recipe creation.

## 📋 Prerequisites

1. OpenAI API key (already set up in your project)
2. Existing API route: `/api/generate-recipe`

## 🔧 Implementation Steps

### Step 1: Create Chat API Route

Create `src/app/api/recipe-chat/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { messages, recipeData } = await request.json();

    const systemPrompt = `You are a friendly, expert chef assistant helping users create recipes through conversation. 

Your role:
- Guide users through recipe creation naturally
- Ask clarifying questions
- Parse ingredients and instructions from natural language
- Be encouraging and helpful
- Keep responses concise (2-3 sentences max)

Current recipe data:
${JSON.stringify(recipeData, null, 2)}

When the user provides information:
- Extract ingredients, instructions, servings, time, cuisine, difficulty
- Respond with what you captured and ask for the next piece
- Use emojis occasionally to be friendly

Example conversation:
User: "I want to make cookies"
You: "Delicious! 🍪 What type of cookies - chocolate chip, oatmeal, sugar? And do you have the ingredients ready?"

User: "Chocolate chip. I have flour, sugar, butter, eggs, chocolate chips"
You: "Perfect! I've got those ingredients. How many servings does this make, and how long will it take to prepare?"`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      temperature: 0.7,
      max_tokens: 200,
    });

    const response = completion.choices[0].message.content;

    // Try to extract structured data from the conversation
    const extraction = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `Extract recipe information from this conversation. Return JSON only.
          
          Format:
          {
            "title": string or null,
            "ingredients": string[] (individual ingredients),
            "instructions": string[] (numbered steps),
            "servings": number or null,
            "prepTime": number (minutes) or null,
            "cuisine": string or null,
            "difficulty": "Easy" | "Medium" | "Hard" or null,
            "tags": string[]
          }`,
        },
        ...messages,
      ],
      temperature: 0.3,
      max_tokens: 500,
    });

    let extractedData = {};
    try {
      extractedData = JSON.parse(extraction.choices[0].message.content || '{}');
    } catch (e) {
      console.error('Failed to parse extracted data');
    }

    return NextResponse.json({
      response,
      extractedData,
    });
  } catch (error) {
    console.error('Recipe chat error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}
```

### Step 2: Update ChatRecipeCreator Component

Replace the `processUserInput` function in `chat-recipe-creator.tsx`:

```typescript
const processUserInput = async (userInput: string) => {
  // Add user message
  addMessage('user', userInput);
  setInput('');
  setIsLoading(true);

  try {
    // Call OpenAI API
    const response = await fetch('/api/recipe-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: messages.map(m => ({
          role: m.role,
          content: m.content,
        })),
        recipeData,
      }),
    });

    if (!response.ok) throw new Error('Chat API failed');

    const data = await response.json();

    // Update recipe data with extracted information
    if (data.extractedData) {
      setRecipeData(prev => {
        const updated = { ...prev };
        
        if (data.extractedData.title) updated.title = data.extractedData.title;
        if (data.extractedData.ingredients?.length) {
          updated.ingredients = [
            ...new Set([...prev.ingredients, ...data.extractedData.ingredients])
          ];
        }
        if (data.extractedData.instructions?.length) {
          updated.instructions = [
            ...new Set([...prev.instructions, ...data.extractedData.instructions])
          ];
        }
        if (data.extractedData.servings) updated.servings = data.extractedData.servings;
        if (data.extractedData.prepTime) updated.prepTime = data.extractedData.prepTime;
        if (data.extractedData.cuisine) updated.cuisine = data.extractedData.cuisine;
        if (data.extractedData.difficulty) updated.difficulty = data.extractedData.difficulty;
        if (data.extractedData.tags?.length) {
          updated.tags = [
            ...new Set([...prev.tags, ...data.extractedData.tags])
          ];
        }

        return updated;
      });

      // Auto-advance conversation step based on what we have
      if (recipeData.title && recipeData.ingredients.length > 0 && 
          recipeData.instructions.length > 0 && recipeData.prepTime) {
        setConversationStep('complete');
      } else if (recipeData.title && recipeData.ingredients.length > 0 && 
                 recipeData.instructions.length > 0) {
        setConversationStep('details');
      } else if (recipeData.title && recipeData.ingredients.length > 0) {
        setConversationStep('instructions');
      } else if (recipeData.title) {
        setConversationStep('ingredients');
      }
    }

    // Add AI response
    addMessage('assistant', data.response);
  } catch (error) {
    console.error('Chat error:', error);
    addMessage('assistant', 
      "Sorry, I had trouble understanding that. Could you try rephrasing? 😅"
    );
  } finally {
    setIsLoading(false);
  }
};
```

### Step 3: Add Image Analysis (Optional)

Add image upload capability to the chat:

```typescript
// In chat-recipe-creator.tsx

const [uploadedImage, setUploadedImage] = useState<string | null>(null);

const handleImageUpload = async (file: File) => {
  const reader = new FileReader();
  reader.onloadend = async () => {
    const base64 = reader.result as string;
    setUploadedImage(base64);
    
    // Send to OpenAI Vision API
    const response = await fetch('/api/recipe-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: 'What recipe can I make from this image?' },
              { type: 'image_url', image_url: { url: base64 } },
            ],
          },
        ],
        recipeData,
      }),
    });
    
    // Process response...
  };
  reader.readAsDataURL(file);
};

// Add to UI (in input area):
<Input
  type="file"
  accept="image/*"
  onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
  className="hidden"
  id="image-upload"
/>
<Button
  variant="outline"
  size="icon"
  onClick={() => document.getElementById('image-upload')?.click()}
>
  <Upload className="h-4 w-4" />
</Button>
```

## 🎯 Advanced Features

### 1. Context-Aware Suggestions

```typescript
// Generate smart quick suggestions based on conversation
const generateSuggestions = async () => {
  const response = await fetch('/api/recipe-chat/suggestions', {
    method: 'POST',
    body: JSON.stringify({ recipeData, conversationStep }),
  });
  
  const { suggestions } = await response.json();
  setSuggestions(suggestions); // e.g., ["Add garlic", "Include herbs", "Make it spicy"]
};
```

### 2. Recipe Refinement

```typescript
// Allow users to ask questions about their recipe
User: "How can I make this healthier?"
AI: "Great question! We could reduce sugar by 25% and use whole wheat flour..."

User: "Can I substitute butter?"
AI: "Yes! You can use coconut oil or applesauce as substitutes..."
```

### 3. Ingredient Substitutions

```typescript
// Smart substitution recommendations
const systemPrompt = `...
When users ask about substitutions, provide alternatives with ratios.
Example: "butter → coconut oil (1:1 ratio) or applesauce (1:0.75 ratio)"
...`;
```

### 4. Nutritional Analysis

```typescript
// After recipe is complete, offer nutrition info
const analyzeNutrition = async () => {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: 'Analyze this recipe and provide nutritional information per serving.',
      },
      {
        role: 'user',
        content: JSON.stringify(recipeData),
      },
    ],
  });
  
  // Display in preview panel
};
```

## 💰 Cost Optimization

```typescript
// Use GPT-3.5-turbo for general chat, GPT-4 for extraction
const chatModel = 'gpt-3.5-turbo'; // ~$0.001/message
const extractionModel = 'gpt-4'; // Only when needed

// Cache system prompts
// Limit message history (keep last 10 messages)
const recentMessages = messages.slice(-10);

// Stream responses for better UX
const stream = await openai.chat.completions.create({
  model: chatModel,
  messages: recentMessages,
  stream: true,
});
```

## 🧪 Testing

```typescript
// Test different scenarios
const testCases = [
  {
    input: "I want to make pizza",
    expected: { title: "Pizza", conversationStep: "ingredients" }
  },
  {
    input: "flour, water, yeast, salt",
    expected: { ingredients: ["flour", "water", "yeast", "salt"] }
  },
  // ... more test cases
];
```

## 🚀 Deployment

1. Ensure `OPENAI_API_KEY` is set in production environment
2. Monitor API usage in OpenAI dashboard
3. Set up rate limiting if needed
4. Add error boundaries for graceful failures

## 📊 Analytics

Track conversation metrics:
```typescript
// Log to analytics service
analytics.track('recipe_chat_started');
analytics.track('recipe_chat_step_completed', { step: conversationStep });
analytics.track('recipe_chat_saved', { 
  messageCount: messages.length,
  timeSpent: sessionDuration 
});
```

---

With these upgrades, your chat interface becomes truly intelligent, understanding context, making smart suggestions, and creating a delightful recipe creation experience! 🎉
