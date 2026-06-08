import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Map allowed MIME types to a fixed, safe extension. The destination filename is
// derived entirely from these values — the client-supplied file.name is never used.
const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
};

export async function POST(request: NextRequest) {
  try {
    // Require an authenticated session — middleware does not cover /api routes.
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file received' }, { status: 400 });
    }

    // Validate file type
    const ext = ALLOWED_TYPES[file.type];
    if (!ext) {
      return NextResponse.json({
        error: 'Invalid file type. Only images are allowed.'
      }, { status: 400 });
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({
        error: 'File too large. Maximum size is 10MB.'
      }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Build the filename from server-controlled values only. The client's
    // file.name is discarded entirely, eliminating path-traversal risk.
    const filename = `${Date.now()}-${randomUUID()}.${ext}`;
    const uploadDir = join(process.cwd(), 'public', 'uploads');

    // Ensure upload directory exists, then write.
    await mkdir(uploadDir, { recursive: true });
    await writeFile(join(uploadDir, filename), buffer);

    const fileUrl = `/uploads/${filename}`;

    return NextResponse.json({
      success: true,
      filename,
      url: fileUrl,
      size: file.size,
      type: file.type
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}
