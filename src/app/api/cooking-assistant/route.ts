import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { z } from 'zod';
import { 
  withErrorHandler, 
  createSuccessResponse, 
  ApiError,
  validateRequestBody 
} from '@/lib/api-utils';

const CookingQuestionSchema = z.object({
  question: z.string().min(1, 'Question is required').max(500, 'Question too long'),
  context: z.string().optional(),
});

type CookingQuestionRequest = z.infer<typeof CookingQuestionSchema>;

interface CookingAssistantResponse {
  answer: string;
  context?: string;
  fallback?: boolean;
}

async function handleCookingAssistant(request: NextRequest) {
  const body = await request.json();
  const { question, context } = validateRequestBody<CookingQuestionRequest>(
    CookingQuestionSchema,
    body
  );

  // Create a cooking-focused system prompt
  const systemPrompt = `You are Chef Assistant, a helpful AI cooking companion designed to help people while they cook. 

You are especially helpful when someone has dirty hands and needs voice assistance. Keep responses concise but informative - ideal for speaking aloud.

You can help with:
- Cooking techniques and tips
- Ingredient substitutions
- Recipe modifications
- Food safety advice
- Timing and temperature guidance
- Kitchen equipment questions
- Dietary restrictions and alternatives

Keep responses under 100 words when possible, and always prioritize food safety. Be encouraging and friendly.

${context ? `Context: The user is currently working with: ${context}` : ''}`;

  try {
    const result = await generateText({
      model: openai('gpt-4-turbo'),
      system: systemPrompt,
      prompt: question,
      temperature: 0.7, // Balanced creativity and accuracy
    });

    // Clean up the response for better voice synthesis
    let answer = result.text
      .replace(/\*\*/g, '') // Remove markdown bold
      .replace(/\*/g, '') // Remove markdown italics
      .replace(/\n+/g, '. ') // Replace line breaks with periods
      .trim();

    // Add helpful follow-up suggestions for common topics
    if (answer.length < 50) {
      if (question.toLowerCase().includes('substitute')) {
        answer += " Would you like suggestions for specific ingredients?";
      } else if (question.toLowerCase().includes('temperature')) {
        answer += " Need help with timing too?";
      } else if (question.toLowerCase().includes('how to')) {
        answer += " Want me to break that down into steps?";
      }
    }

    const responseData: CookingAssistantResponse = {
      answer,
      context,
    };

    return createSuccessResponse(responseData);

  } catch (error) {
    console.error('OpenAI API error:', error);
    
    // Provide fallback responses when AI service fails
    const fallbackAnswer = getFallbackAnswer(question);
    
    const responseData: CookingAssistantResponse = {
      answer: fallbackAnswer,
      context: undefined,
      fallback: true,
    };

    return createSuccessResponse(responseData);
  }
}

function getFallbackAnswer(question: string): string {
  const questionLower = question.toLowerCase();
  
  if (questionLower.includes('substitute')) {
    return "Common substitutions include: butter for oil in baking, milk for buttermilk with lemon juice, or egg with applesauce. What ingredient do you need to substitute?";
  } else if (questionLower.includes('temperature')) {
    return "Most ovens should be preheated. Chicken should reach 165°F internal temperature, and beef varies by preference. What are you cooking?";
  } else if (questionLower.includes('how long')) {
    return "Cooking times vary by method and thickness. Check for doneness signs like color, texture, or use a thermometer. What dish are you preparing?";
  } else {
    return "I'm having trouble with that question right now. Try asking about cooking techniques, ingredient substitutions, or timing help.";
  }
}

export const POST = withErrorHandler(handleCookingAssistant);