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

// GET - Retrieve API keys (masked) - Admin Only
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

    // Check if user is admin
    if (!user.role || user.role === 'USER') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Return masked version
    const response: any = {};
    if (user.openaiApiKey) {
      try {
        // Check if encryption secret is set
        if (!process.env.API_KEY_ENCRYPTION_SECRET) {
          console.warn('API_KEY_ENCRYPTION_SECRET not set, cannot decrypt');
          response.openaiApiKey = '****'; // Show masked placeholder
        } else {
          const decrypted = decryptApiKey(user.openaiApiKey);
          response.openaiApiKey = maskApiKey(decrypted);
        }
      } catch (error) {
        console.error('Failed to decrypt API key:', error);
        // Return masked placeholder on error
        response.openaiApiKey = '****';
      }
    }

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error fetching API keys:', error);
    
    // Check if it's a database column error
    if (error.code === 'P2022' || error.message?.includes('openaiApiKey')) {
      // Column doesn't exist yet, return empty response
      return NextResponse.json({});
    }
    
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

    // Check if encryption secret is set
    if (!process.env.API_KEY_ENCRYPTION_SECRET) {
      console.error('API_KEY_ENCRYPTION_SECRET is not configured');
      return NextResponse.json(
        { error: 'API key storage is not configured. Please contact support.' },
        { status: 503 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true }
    }) as any;

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user is admin
    if (!user.role || user.role === 'USER') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Prepare update data
    const updateData: any = {};
    
    if (openaiApiKey !== undefined) {
      if (openaiApiKey === '' || openaiApiKey === null) {
        // Remove API key
        updateData.openaiApiKey = null;
      } else {
        // Validate API key format (basic check)
        if (typeof openaiApiKey !== 'string' || openaiApiKey.length < 10) {
          return NextResponse.json(
            { error: 'Invalid API key format' },
            { status: 400 }
          );
        }
        
        try {
          // Encrypt and store
          updateData.openaiApiKey = encryptApiKey(openaiApiKey);
        } catch (encryptError) {
          console.error('Encryption error:', encryptError);
          return NextResponse.json(
            { error: 'Failed to encrypt API key' },
            { status: 500 }
          );
        }
      }
    }

    // Update user
    try {
      await prisma.user.update({
        where: { id: user.id },
        data: updateData
      });
    } catch (dbError: any) {
      console.error('Database error:', dbError);
      
      // Check if it's a column not found error
      if (dbError.code === 'P2022' || dbError.message?.includes('openaiApiKey')) {
        return NextResponse.json(
          { error: 'Database migration required. Please contact support.' },
          { status: 503 }
        );
      }
      
      throw dbError;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating API keys:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
