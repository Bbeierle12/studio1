import { NextRequest, NextResponse } from 'next/server';
import { generateText } from 'ai';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/data';
import { createUserOpenAI, getModelName, getUserOpenAIKey } from '@/lib/openai-utils';

/**
 * Test endpoint to verify OpenAI integration
 * This helps diagnose issues with the voice assistant
 */
export async function GET(request: NextRequest) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({
        error: 'Unauthorized',
        message: 'Please sign in to test the API',
      }, { status: 401 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, email: true, role: true },
    });

    if (!user) {
      return NextResponse.json({
        error: 'User not found',
      }, { status: 404 });
    }

    // This is a diagnostic endpoint that reveals configuration state and makes a
    // billable OpenAI call. Restrict it to admins so a regular member can't use
    // it to probe key configuration or run up usage.
    if (!user.role || user.role === 'USER') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Report only whether a system key is configured — never its length or any
    // prefix of the key material, which is sensitive.
    const envKeyExists = !!process.env.OPENAI_API_KEY;

    // Report only whether a personal key is configured — never any part of it.
    let userHasKey = false;
    let userKeyInfo = 'No personal key configured';
    try {
      const userKey = await getUserOpenAIKey(user.id);
      userHasKey = !!userKey;
      if (userKey) {
        userKeyInfo = 'Personal key configured';
      }
    } catch (error) {
      userKeyInfo = 'Error retrieving personal key';
    }

    // Try to create OpenAI client
    let clientCreated = false;
    let clientError = null;
    try {
      const openaiClient = await createUserOpenAI(user.id);
      clientCreated = true;
    } catch (error) {
      clientError = error instanceof Error ? error.message : String(error);
    }

    // Try a simple API call
    let testCallSuccess = false;
    let testCallResponse = null;
    let testCallError = null;
    
    if (clientCreated) {
      try {
        const openaiClient = await createUserOpenAI(user.id);
        const modelName = getModelName(undefined, 'gpt-4-turbo');
        
        const result = await generateText({
          model: openaiClient(modelName),
          prompt: 'Say "Hello, voice assistant test successful!" in exactly those words.',
          temperature: 0,
        });
        
        testCallSuccess = true;
        testCallResponse = result.text;
      } catch (error) {
        testCallError = error instanceof Error ? error.message : String(error);
      }
    }

    return NextResponse.json({
      status: 'OpenAI Integration Test',
      timestamp: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email,
      },
      environment: {
        OPENAI_API_KEY: {
          exists: envKeyExists,
        },
      },
      userKey: {
        configured: userHasKey,
        info: userKeyInfo,
      },
      client: {
        created: clientCreated,
        error: clientError,
      },
      testCall: {
        success: testCallSuccess,
        response: testCallResponse,
        error: testCallError,
      },
      recommendation: testCallSuccess 
        ? '✅ Everything is working! The voice assistant should work.'
        : '❌ There is an issue. Check the errors above.',
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json({
      error: 'Test failed',
      message: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
