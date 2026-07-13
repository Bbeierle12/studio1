import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_MODEL_ID } from '@/lib/ai-config';

// Initialize the Google Generative AI
const apiKey = process.env.GEMINI_API_KEY;

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API key is not configured.' },
        { status: 500 }
      );
    }

    const { text } = await req.json();

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'No text or URL provided.' },
        { status: 400 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL_ID });

    const prompt = `
You are a culinary assistant helping format unstructured text (which might be a messy social media caption or a webpage excerpt) into a structured recipe.
Extract all recipe information you can find.
Format your response as a strictly valid JSON object. Do not include markdown code blocks like \`\`\`json. Just return the JSON object directly.

Schema:
{
  "title": "Recipe Title (string)",
  "prepTime": 30, // Total time in minutes (number, fallback to 0)
  "servings": 4, // Number of servings (number, fallback to 1)
  "ingredients": ["1 cup flour", "2 eggs"], // Array of ingredient strings
  "instructions": ["Mix ingredients.", "Bake for 30 minutes."], // Array of step-by-step instructions
  "summary": "A short 1-2 sentence summary of the recipe (string)",
  "tags": ["dinner", "chicken", "easy"], // Array of descriptive tags
  "cuisine": "American", // (string)
  "course": "Main", // (string)
  "difficulty": "Easy" // (string)
}

Input Text:
${text}
`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Attempt to parse the JSON
    let parsedData;
    try {
      // Remove any potential markdown code blocks
      const cleanJson = responseText.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
      parsedData = JSON.parse(cleanJson);
    } catch (parseError) {
      console.error('Failed to parse Gemini output as JSON:', responseText);
      return NextResponse.json(
        { error: 'AI failed to return valid recipe data. Please try again.' },
        { status: 500 }
      );
    }

    // Map to ParsedRecipe interface format expected by the frontend
    const recipe = {
      title: parsedData.title || 'Imported AI Recipe',
      description: parsedData.summary || '',
      ingredients: parsedData.ingredients || [],
      instructions: parsedData.instructions || [],
      totalTime: parsedData.prepTime,
      servings: parsedData.servings,
      tags: parsedData.tags || [],
      cuisine: parsedData.cuisine || '',
      course: parsedData.course || '',
    };

    return NextResponse.json({
      recipe,
      saved: false,
      message: 'Recipe parsed successfully with AI',
    });
  } catch (error) {
    console.error('Error parsing recipe with Gemini:', error);
    return NextResponse.json(
      { error: 'Failed to process recipe with AI.' },
      { status: 500 }
    );
  }
}
