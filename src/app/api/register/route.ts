import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/data';
import { addPasswordToHistory } from '@/lib/password-history';
import { getClientInfo, logLoginAttempt } from '@/lib/login-anomaly';
import {
  checkRateLimit,
  getRateLimitIdentifier,
  formatRateLimitError,
  RATE_LIMITS,
} from '@/lib/rate-limit';

// Match the password policy enforced at password change: 12+ chars with mixed
// case, a number, and a special character. Previously registration allowed weak
// 8-character passwords with no complexity.
const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(12, 'Password must be at least 12 characters')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character'),
});

export async function POST(request: NextRequest) {
  try {
    // Throttle registration per IP to slow account-creation spam and
    // enumeration attempts.
    const { ipAddress: clientIp } = getClientInfo(request);
    const rateLimit = checkRateLimit(
      getRateLimitIdentifier(undefined, clientIp),
      RATE_LIMITS.AUTH
    );
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: formatRateLimitError(rateLimit.resetIn, RATE_LIMITS.AUTH.message) },
        { status: 429 }
      );
    }

    const body = await request.json();

    // Validate input
    const validatedData = registerSchema.parse(body);
    const { name, email, password } = validatedData;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email address already exists.' },
        { status: 400 }
      );
    }

    // Create new user
    const hashedPassword = await hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        name: name.trim(),
      },
    });

    // Add initial password to history
    await addPasswordToHistory(user.id, password);

    // Log successful registration
    const { ipAddress, userAgent } = getClientInfo(request);
    await logLoginAttempt({
      email: user.email,
      ipAddress,
      userAgent,
      successful: true,
      userId: user.id,
    });

    // Return success (don't include password in response)
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });

  } catch (error) {
    console.error('Registration error:', error);

    // Handle validation errors
    if (error instanceof z.ZodError) {
      const fieldErrors = error.errors.map(err => ({
        field: err.path[0],
        message: err.message,
      }));
      return NextResponse.json(
        { error: 'Validation failed', fieldErrors },
        { status: 400 }
      );
    }

    // Handle Prisma errors
    if (error instanceof Error) {
      // Database connection errors
      if (error.message.includes('connect') || error.message.includes('DATABASE_URL')) {
        console.error('Database connection error:', error.message);
        return NextResponse.json(
          { error: 'Database connection failed. Please try again later or contact support.' },
          { status: 503 }
        );
      }

      // Prisma unique constraint violations
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json(
          { error: 'An account with this email address already exists.' },
          { status: 400 }
        );
      }

      // Log the actual error message for debugging
      console.error('Registration error details:', error.message);
    }

    // Handle other errors
    return NextResponse.json(
      { error: 'Registration failed. Please try again or contact support if the problem persists.' },
      { status: 500 }
    );
  }
}