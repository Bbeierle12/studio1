import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/data';

// Validate profile fields to close a stored-XSS surface: constrain avatarUrl to
// an http(s) URL (rejecting javascript:/data: schemes) and length-limit the
// free-text name/bio. Empty strings are allowed so a field can be cleared.
const profileUpdateSchema = z.object({
  name: z.string().max(50, 'Name must be at most 50 characters').optional(),
  bio: z.string().max(1000, 'Bio must be at most 1000 characters').optional(),
  avatarUrl: z
    .union([
      z.literal(''),
      z
        .string()
        .url('Avatar URL must be a valid URL')
        .refine((url) => /^https?:\/\//i.test(url), {
          message: 'Avatar URL must use http or https',
        }),
    ])
    .optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, bio, avatarUrl } = profileUpdateSchema.parse(body);

    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        name: name || undefined,
        bio: bio || undefined,
        avatarUrl: avatarUrl || undefined,
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        bio: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Profile update error:', error);

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

    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
