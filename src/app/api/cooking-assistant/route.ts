import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

export async function POST(request: NextRequest) {
  try {
    const { question, context } = await request.json();

    if (!question) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 });
    }

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

    return NextResponse.json({
      success: true,
      answer: answer,
      context: context
    });

  } catch (error) {
    console.error('Cooking assistant error:', error);
    
    // Fallback responses for common questions when AI fails
    const question_lower = (await request.json()).question?.toLowerCase() || '';
    
    let fallbackAnswer = '';
    
    if (question_lower.includes('substitute')) {
      fallbackAnswer = "Common substitutions include: butter for oil in baking, milk for buttermilk with lemon juice, or egg with applesauce. What ingredient do you need to substitute?";
    } else if (question_lower.includes('temperature')) {
      fallbackAnswer = "Most ovens should be preheated. Chicken should reach 165°F internal temperature, and beef varies by preference. What are you cooking?";
    } else if (question_lower.includes('how long')) {
      fallbackAnswer = "Cooking times vary by method and thickness. Check for doneness signs like color, texture, or use a thermometer. What dish are you preparing?";
    } else {
      fallbackAnswer = "I'm having trouble with that question right now. Try asking about cooking techniques, ingredient substitutions, or timing help.";
    }

    return NextResponse.json({
      success: true,
      answer: fallbackAnswer,
      context: null,
      fallback: true
    });
  }
}