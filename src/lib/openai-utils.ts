/**
 * OpenAI Utilities
 * Provides functions to manage user-specific OpenAI API keys and configurations
 */

import { createOpenAI } from '@ai-sdk/openai';
import * as crypto from 'crypto';
import { prisma } from '@/lib/data';

// Encryption configuration (matches api-keys route)
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Get encryption key from environment
 */
function getEncryptionKey(): Buffer {
  const key = process.env.API_KEY_ENCRYPTION_SECRET;
  if (!key) {
    throw new Error('API_KEY_ENCRYPTION_SECRET is not set');
  }
  return crypto.pbkdf2Sync(key, 'salt', 100000, 32, 'sha256');
}

/**
 * Decrypt API key
 */
export function decryptApiKey(encryptedText: string): string {
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

/**
 * Get user's OpenAI API key (decrypted)
 * Falls back to system key if user hasn't set one
 */
export async function getUserOpenAIKey(userId: string): Promise<string | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { openaiApiKey: true },
    });

    if (user?.openaiApiKey) {
      try {
        return decryptApiKey(user.openaiApiKey);
      } catch (error) {
        console.error('Failed to decrypt user API key:', error);
      }
    }

    // Fallback to system key
    return process.env.OPENAI_API_KEY || null;
  } catch (error) {
    console.error('Error fetching user OpenAI key:', error);
    return process.env.OPENAI_API_KEY || null;
  }
}

/**
 * Create an OpenAI instance with user-specific or system API key
 * @param userId - User ID to fetch key for
 * @returns OpenAI instance configured with appropriate key
 */
export async function createUserOpenAI(userId: string) {
  const apiKey = await getUserOpenAIKey(userId);
  
  if (!apiKey) {
    throw new Error('No OpenAI API key available. Please configure your API key in settings.');
  }

  return createOpenAI({
    apiKey,
  });
}

/**
 * Get model name with fallback
 * Users can override default models
 */
export function getModelName(
  requestedModel?: string,
  defaultModel: string = 'gpt-4-turbo'
): string {
  // Allow model override from environment
  const envModel = process.env.OPENAI_DEFAULT_MODEL;
  
  return requestedModel || envModel || defaultModel;
}

/**
 * Check if user has a valid OpenAI API key configured
 */
export async function hasValidOpenAIKey(userId: string): Promise<boolean> {
  try {
    const key = await getUserOpenAIKey(userId);
    return !!key && key.startsWith('sk-');
  } catch {
    return false;
  }
}

/**
 * Validate OpenAI API key format
 */
export function isValidOpenAIKeyFormat(key: string): boolean {
  // OpenAI keys start with 'sk-' and are at least 40 characters
  return key.startsWith('sk-') && key.length >= 40;
}

/**
 * Configuration options for OpenAI calls
 */
export interface OpenAIOptions {
  userId: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  useSystemFallback?: boolean; // If true, fall back to system key on error
}

/**
 * Error class for OpenAI-related errors
 */
export class OpenAIError extends Error {
  constructor(
    message: string,
    public code: 'NO_KEY' | 'INVALID_KEY' | 'API_ERROR' | 'QUOTA_EXCEEDED'
  ) {
    super(message);
    this.name = 'OpenAIError';
  }
}

/**
 * Retry logic for OpenAI calls
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 2,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // Don't retry on certain errors
      if (error.status === 401 || error.status === 403) {
        throw new OpenAIError(
          'Invalid API key. Please check your OpenAI API key in settings.',
          'INVALID_KEY'
        );
      }
      
      if (error.status === 429) {
        throw new OpenAIError(
          'OpenAI API rate limit exceeded. Please try again later.',
          'QUOTA_EXCEEDED'
        );
      }
      
      // Wait before retrying
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs * (i + 1)));
      }
    }
  }
  
  throw new OpenAIError(
    `OpenAI API call failed after ${maxRetries} attempts: ${lastError!.message}`,
    'API_ERROR'
  );
}

/**
 * Log OpenAI usage for monitoring
 */
export async function logOpenAIUsage(
  userId: string,
  model: string,
  inputTokens: number,
  outputTokens: number,
  cost?: number
) {
  try {
    // You can implement usage tracking here
    // For now, just log to console
    console.log('OpenAI Usage:', {
      userId,
      model,
      inputTokens,
      outputTokens,
      cost,
      timestamp: new Date().toISOString(),
    });
    
    // TODO: Store in database for usage analytics
    // await prisma.openAIUsage.create({
    //   data: { userId, model, inputTokens, outputTokens, cost }
    // });
  } catch (error) {
    console.error('Failed to log OpenAI usage:', error);
  }
}
