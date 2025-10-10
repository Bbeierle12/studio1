import { NextRequest, NextResponse } from 'next/server';
// Import your OpenAI SDK (update import if using a different package)
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { messages, recipeData } = await request.json();

    // Check if API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY is not configured');
      return NextResponse.json(
        { error: 'OpenAI API key is not configured' },
        { status: 500 }
      );
    }

    // System prompt for ChatGPT-5
    const systemPrompt = `You are a friendly, expert chef assistant helping users create recipes through conversation.\n\nYour role:\n- Guide users through recipe creation naturally\n- Ask clarifying questions\n- Parse ingredients and instructions from natural language\n- Be encouraging and helpful\n- Keep responses concise (2-3 sentences max)\n\nCurrent recipe data:\n${JSON.stringify(recipeData, null, 2)}\n\nWhen the user provides information:\n- Extract ingredients, instructions, servings, time, cuisine, difficulty\n- Respond with what you captured and ask for the next piece\n- Use emojis occasionally to be friendly`;

    // Call ChatGPT-5 (update model name if needed)
    const completion = await openai.chat.completions.create({
      model: 'gpt-5',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      max_completion_tokens: 300,
    });

    const response = completion.choices[0].message.content;

    // Extraction step: ask ChatGPT-5 to return structured recipe data
    const extraction = await openai.chat.completions.create({
      model: 'gpt-5',
      messages: [
        {
          role: 'system',
          content: `Extract recipe information from this conversation. Return JSON only.\n\nFormat:\n{\n  "title": string or null,\n  "ingredients": string[] (individual ingredients),\n  "instructions": string[] (numbered steps),\n  "servings": number or null,\n  "prepTime": number (minutes) or null,\n  "cuisine": string or null,\n  "difficulty": "Easy" | "Medium" | "Hard" | null,\n  "tags": string[]\n}`,
        },
        ...messages,
      ],
      max_completion_tokens: 500,
    });

    let extractedData = {};
    try {
      extractedData = JSON.parse(extraction.choices[0].message.content || '{}');
    } catch (e) {
      // fallback: empty object
    }

    return NextResponse.json({
      response,
      extractedData,
    });
  } catch (error) {
    console.error('Recipe chat error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process chat message',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
