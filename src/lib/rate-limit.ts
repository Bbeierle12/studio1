/**
 * Rate Limiting for API Protection
 * Prevents abuse of OpenAI API and protects your API key costs
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store (use Redis for production)
const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  maxRequests: number;    // Max requests per window
  windowMs: number;       // Time window in milliseconds
  message?: string;       // Custom error message
}

/**
 * Default rate limits for different endpoints
 */
export const RATE_LIMITS = {
  // Voice Assistant / Cooking Questions
  AI_ASSISTANT: {
    maxRequests: 20,      // 20 requests
    windowMs: 60000,      // per minute
    message: 'Too many AI requests. Please wait a moment before trying again.'
  },
  
  // Recipe Generation (more expensive)
  AI_RECIPE_GENERATION: {
    maxRequests: 5,       // 5 requests
    windowMs: 300000,     // per 5 minutes
    message: 'Recipe generation limit reached. Please wait before generating more recipes.'
  },
  
  // General API protection
  GENERAL: {
    maxRequests: 100,     // 100 requests
    windowMs: 60000,      // per minute
    message: 'Too many requests. Please slow down.'
  }
};

/**
 * Check if user has exceeded rate limit
 * @param identifier - User identifier (userId or IP)
 * @param config - Rate limit configuration
 * @returns Object with allowed status and remaining count
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  // Clean up expired entries periodically
  if (Math.random() < 0.01) { // 1% chance
    cleanupExpiredEntries();
  }

  // No entry or expired entry - allow request
  if (!entry || entry.resetTime < now) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetTime: now + config.windowMs,
    };
    rateLimitStore.set(identifier, newEntry);
    
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetIn: config.windowMs,
    };
  }

  // Entry exists and is valid
  if (entry.count < config.maxRequests) {
    entry.count++;
    rateLimitStore.set(identifier, entry);
    
    return {
      allowed: true,
      remaining: config.maxRequests - entry.count,
      resetIn: entry.resetTime - now,
    };
  }

  // Rate limit exceeded
  return {
    allowed: false,
    remaining: 0,
    resetIn: entry.resetTime - now,
  };
}

/**
 * Clean up expired entries from rate limit store
 */
function cleanupExpiredEntries() {
  const now = Date.now();
  const expiredKeys: string[] = [];

  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      expiredKeys.push(key);
    }
  }

  for (const key of expiredKeys) {
    rateLimitStore.delete(key);
  }
}

/**
 * Get rate limit identifier from user ID or IP
 */
export function getRateLimitIdentifier(userId?: string, ip?: string): string {
  return userId || ip || 'anonymous';
}

/**
 * Format rate limit error message
 */
export function formatRateLimitError(resetIn: number, message?: string): string {
  const seconds = Math.ceil(resetIn / 1000);
  const defaultMessage = `Rate limit exceeded. Please try again in ${seconds} seconds.`;
  return message || defaultMessage;
}
