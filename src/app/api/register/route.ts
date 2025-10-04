import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/data';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export async function POST(request: NextRequest) {
  try {
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