import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const isHandwritten = formData.get('isHandwritten') === 'true';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');
    const mimeType = file.type;

    // Use OpenAI Vision API for OCR and recipe understanding
    const prompt = isHandwritten 
      ? `You are an expert at reading handwritten recipes. Please carefully examine this image and extract all the recipe information you can see. Pay special attention to:

1. Recipe title/name
2. Ingredients list with measurements
3. Cooking instructions/steps
4. Any additional notes (cooking time, temperature, serving size, etc.)

For handwritten text, be extra careful about interpreting unclear handwriting. If you're uncertain about a word, indicate it with [unclear] but make your best guess. Format the output as a structured recipe with clear sections.

Please provide a confidence score (1-10) for how clearly you could read the handwritten text.`
      : `Please extract the recipe information from this image. Look for:

1. Recipe title/name
2. Ingredients list with measurements
3. Cooking instructions/steps  
4. Any additional information (cooking time, temperature, serving size, etc.)

Format the output as a structured recipe with clear sections.`;

    const result = await generateText({
      model: openai('gpt-4-turbo'),
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt,
            },
            {
              type: 'image',
              image: `data:${mimeType};base64,${base64}`,
            },
          ],
        },
      ],
    });

    // Parse the response to extract structured data
    const extractedText = result.text;
    
    // Use another AI call to structure the data
    const structureResult = await generateText({
      model: openai('gpt-4-turbo'),
      prompt: `Please convert the following recipe text into a structured JSON format:

${extractedText}

Return a JSON object with the following structure:
{
  "title": "Recipe Name",
  "ingredients": ["ingredient 1", "ingredient 2", ...],
  "instructions": ["step 1", "step 2", ...],
  "additionalInfo": {
    "servingSize": "X servings",
    "cookTime": "X minutes",
    "prepTime": "X minutes",
    "temperature": "X°F",
    "notes": "any additional notes"
  },
  "confidence": X (1-10 scale for handwritten recipes),
  "isHandwritten": boolean
}

Only include fields that have actual data. If information is missing, omit those fields.`,
    });

    let structuredRecipe;
    try {
      structuredRecipe = JSON.parse(structureResult.text);
    } catch (e) {
      // Fallback if JSON parsing fails
      structuredRecipe = {
        title: "Extracted Recipe",
        rawText: extractedText,
        confidence: isHandwritten ? 5 : 8,
        isHandwritten: isHandwritten
      };
    }

    return NextResponse.json({
      success: true,
      rawText: extractedText,
      structuredData: structuredRecipe,
      isHandwritten: isHandwritten
    });

  } catch (error) {
    console.error('Transcription error:', error);
    return NextResponse.json(
      { error: 'Failed to transcribe image' }, 
      { status: 500 }
    );
  }
}