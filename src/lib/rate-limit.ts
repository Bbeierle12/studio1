/**
 * Rate Limiting for API Protection
 * Prevents abuse of OpenAI API and protects your API key costs
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

/**
 * Result returned by every rate-limit store implementation.
 */
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetIn: number;
}

/**
 * Storage seam for the limiter. Swapping this out is the only thing that
 * changes when moving from single-host (in-memory Map) to a shared store
 * (Redis / Upstash / Vercel KV) for multi-instance deployments.
 */
interface RateLimitStore {
  check(identifier: string, config: RateLimitConfig): RateLimitResult;
}

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
  
  // Admin mutations (POST/PUT/DELETE)
  ADMIN_MUTATIONS: {
    maxRequests: 10,      // 10 requests
    windowMs: 60000,      // per minute
    message: 'Too many admin operations. Please slow down.'
  },
  
  // Admin sensitive operations (role changes, deletions)
  ADMIN_SENSITIVE: {
    maxRequests: 5,       // 5 requests
    windowMs: 60000,      // per minute
    message: 'Rate limit for sensitive operations. Please wait before continuing.'
  },
  
  // General API protection
  GENERAL: {
    maxRequests: 100,     // 100 requests
    windowMs: 60000,      // per minute
    message: 'Too many requests. Please slow down.'
  },

  // Authentication endpoints (registration / login) - throttle per IP to slow
  // brute-force, password spraying, and account-creation spam.
  AUTH: {
    maxRequests: 10,      // 10 attempts
    windowMs: 900000,     // per 15 minutes
    message: 'Too many attempts. Please wait a few minutes and try again.'
  }
};

/**
 * In-memory store (single-host / dev fallback). A per-process Map resets on
 * restart and is not shared across instances, so it is only correct on a
 * single-host deployment (e.g. HB). Use a shared store for multi-instance.
 */
function createInMemoryStore(): RateLimitStore {
  const rateLimitStore = new Map<string, RateLimitEntry>();

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

  return {
    check(identifier, config) {
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
    },
  };
}

/**
 * Shared-store adapter (Redis / Upstash / Vercel KV) for multi-instance
 * deployments where counters must survive restarts and be shared across
 * processes. This is a documented stub: once RATE_LIMIT_REDIS_URL /
 * RATE_LIMIT_KV_URL is set, wire an actual client here. Until then it throws
 * so a misconfigured shared-store deploy fails loud instead of silently
 * falling back to a per-process Map.
 */
function createSharedStore(): RateLimitStore {
  return {
    check() {
      throw new Error(
        'Rate limit shared store requested (RATE_LIMIT_REDIS_URL/RATE_LIMIT_KV_URL is set) ' +
        'but no client is wired. Configure a store adapter in createSharedStore().'
      );
    },
  };
}

// Select the store once, based on env. Presence of a shared-store URL opts into
// the shared adapter; otherwise fall back to the in-memory Map (dev/single-host).
let store: RateLimitStore | undefined;
function getStore(): RateLimitStore {
  if (!store) {
    const sharedStoreUrl =
      process.env.RATE_LIMIT_REDIS_URL || process.env.RATE_LIMIT_KV_URL;
    store = sharedStoreUrl ? createSharedStore() : createInMemoryStore();
  }
  return store;
}

/**
 * Check if user has exceeded rate limit
 * @param identifier - User identifier (userId or IP)
 * @param config - Rate limit configuration
 * @returns Object with allowed status and remaining count
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  return getStore().check(identifier, config);
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
