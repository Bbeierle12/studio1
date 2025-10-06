import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/data';
import * as crypto from 'crypto';

// Encryption configuration
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 32;

// Get encryption key from environment
function getEncryptionKey(): Buffer {
  const key = process.env.API_KEY_ENCRYPTION_SECRET;
  if (!key) {
    throw new Error('API_KEY_ENCRYPTION_SECRET is not set');
  }
  // Derive a 32-byte key from the secret
  return crypto.pbkdf2Sync(key, 'salt', 100000, 32, 'sha256');
}

// Encrypt API key
function encryptApiKey(text: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  // Combine iv + authTag + encrypted data
  return iv.toString('hex') + authTag.toString('hex') + encrypted;
}

// Decrypt API key
function decryptApiKey(encryptedText: string): string {
  const key = getEncryptionKey();
  
  // Extract iv, authTag, and encrypted data
  const iv = Buffer.from(encryptedText.slice(0, IV_LENGTH * 2), 'hex');
  const authTag = Buffer.from(
    encryptedText.slice(IV_LENGTH * 2, (IV_LENGTH + AUTH_TAG_LENGTH) * 2),
    'hex'
  );
  const encrypted = encryptedText.slice((IV_LENGTH + AUTH_TAG_LENGTH) * 2);
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

// Mask API key for display (show only last 4 characters)
function maskApiKey(key: string): string {
  if (key.length <= 4) return '****';
  return '****' + key.slice(-4);
}

// GET - Retrieve API keys (masked)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    }) as any;

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Return masked version
    const response: any = {};
    if (user.openaiApiKey) {
      try {
        const decrypted = decryptApiKey(user.openaiApiKey);
        response.openaiApiKey = maskApiKey(decrypted);
      } catch (error) {
        console.error('Failed to decrypt API key:', error);
      }
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching API keys:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH - Update API keys
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { openaiApiKey } = body;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {};
    
    if (openaiApiKey !== undefined) {
      if (openaiApiKey === '' || openaiApiKey === null) {
        // Remove API key
        updateData.openaiApiKey = null;
      } else {
        // Encrypt and store
        updateData.openaiApiKey = encryptApiKey(openaiApiKey);
      }
    }

    // Update user
    await prisma.user.update({
      where: { id: user.id },
      data: updateData
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating API keys:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
