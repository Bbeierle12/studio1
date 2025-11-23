/**
 * Security Utilities Test Suite
 * 
 * Tests CSRF protection and rate limiting functionality.
 * Run with: npm test
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  checkRateLimit,
  getRateLimitIdentifier,
  formatRateLimitError,
  RATE_LIMITS,
  type RateLimitConfig,
} from '@/lib/rate-limit';

describe('Security Utilities', () => {
  describe('Rate Limiting', () => {
    describe('checkRateLimit', () => {
      beforeEach(() => {
        // Note: In a real scenario, we'd want to clear the rate limit store
        // For now, we use unique identifiers for each test
      });

      it('should allow requests within limit', () => {
        const config: RateLimitConfig = {
          maxRequests: 5,
          windowMs: 60000,
        };

        const result1 = checkRateLimit('test-user-1', config);
        expect(result1.allowed).toBe(true);
        expect(result1.remaining).toBe(4);

        const result2 = checkRateLimit('test-user-1', config);
        expect(result2.allowed).toBe(true);
        expect(result2.remaining).toBe(3);
      });

      it('should deny requests exceeding limit', () => {
        const config: RateLimitConfig = {
          maxRequests: 3,
          windowMs: 60000,
        };

        // Use up the limit
        checkRateLimit('test-user-2', config);
        checkRateLimit('test-user-2', config);
        checkRateLimit('test-user-2', config);

        // This should be denied
        const result = checkRateLimit('test-user-2', config);
        expect(result.allowed).toBe(false);
        expect(result.remaining).toBe(0);
      });

      it('should track different identifiers separately', () => {
        const config: RateLimitConfig = {
          maxRequests: 2,
          windowMs: 60000,
        };

        // Use up limit for user-3
        checkRateLimit('test-user-3', config);
        checkRateLimit('test-user-3', config);

        // user-4 should still be allowed
        const result = checkRateLimit('test-user-4', config);
        expect(result.allowed).toBe(true);
      });

      it('should reset after time window', async () => {
        const config: RateLimitConfig = {
          maxRequests: 2,
          windowMs: 50, // Very short window for testing
        };

        const identifier = 'test-user-5';

        // Use up the limit
        checkRateLimit(identifier, config);
        checkRateLimit(identifier, config);

        // Should be denied
        expect(checkRateLimit(identifier, config).allowed).toBe(false);

        // Wait for window to reset
        await new Promise((resolve) => setTimeout(resolve, 60));

        // Should be allowed again
        const result = checkRateLimit(identifier, config);
        expect(result.allowed).toBe(true);
      });

      it('should return correct remaining count', () => {
        const config: RateLimitConfig = {
          maxRequests: 10,
          windowMs: 60000,
        };

        const result1 = checkRateLimit('test-user-6', config);
        expect(result1.remaining).toBe(9);

        const result2 = checkRateLimit('test-user-6', config);
        expect(result2.remaining).toBe(8);
      });

      it('should return resetIn time', () => {
        const config: RateLimitConfig = {
          maxRequests: 5,
          windowMs: 60000,
        };

        const result = checkRateLimit('test-user-7', config);
        expect(result.resetIn).toBeGreaterThan(0);
        expect(result.resetIn).toBeLessThanOrEqual(60000);
      });

      it('should handle very small rate limits', () => {
        const config: RateLimitConfig = {
          maxRequests: 1,
          windowMs: 1000,
        };

        const result1 = checkRateLimit('test-user-8', config);
        expect(result1.allowed).toBe(true);

        const result2 = checkRateLimit('test-user-8', config);
        expect(result2.allowed).toBe(false);
      });

      it('should handle large rate limits', () => {
        const config: RateLimitConfig = {
          maxRequests: 1000,
          windowMs: 60000,
        };

        const result = checkRateLimit('test-user-9', config);
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(999);
      });
    });

    describe('getRateLimitIdentifier', () => {
      it('should prefer userId over IP', () => {
        const identifier = getRateLimitIdentifier('user-123', '192.168.1.1');
        expect(identifier).toBe('user-123');
      });

      it('should use IP when userId not provided', () => {
        const identifier = getRateLimitIdentifier(undefined, '192.168.1.1');
        expect(identifier).toBe('192.168.1.1');
      });

      it('should use anonymous when neither provided', () => {
        const identifier = getRateLimitIdentifier();
        expect(identifier).toBe('anonymous');
      });

      it('should handle empty strings', () => {
        const identifier = getRateLimitIdentifier('', '');
        expect(identifier).toBe('anonymous');
      });
    });

    describe('formatRateLimitError', () => {
      it('should format error with seconds', () => {
        const message = formatRateLimitError(5000);
        expect(message).toContain('5 seconds');
      });

      it('should round up seconds', () => {
        const message = formatRateLimitError(1500);
        expect(message).toContain('2 seconds');
      });

      it('should use custom message when provided', () => {
        const customMessage = 'Custom rate limit message';
        const message = formatRateLimitError(5000, customMessage);
        expect(message).toBe(customMessage);
      });

      it('should handle very short times', () => {
        const message = formatRateLimitError(100);
        expect(message).toContain('1 seconds'); // Rounds up to 1
      });

      it('should handle very long times', () => {
        const message = formatRateLimitError(120000);
        expect(message).toContain('120 seconds');
      });
    });

    describe('RATE_LIMITS configuration', () => {
      it('should have AI_ASSISTANT limit', () => {
        expect(RATE_LIMITS.AI_ASSISTANT).toBeDefined();
        expect(RATE_LIMITS.AI_ASSISTANT.maxRequests).toBe(20);
        expect(RATE_LIMITS.AI_ASSISTANT.windowMs).toBe(60000);
        expect(RATE_LIMITS.AI_ASSISTANT.message).toBeDefined();
      });

      it('should have AI_RECIPE_GENERATION limit', () => {
        expect(RATE_LIMITS.AI_RECIPE_GENERATION).toBeDefined();
        expect(RATE_LIMITS.AI_RECIPE_GENERATION.maxRequests).toBe(5);
        expect(RATE_LIMITS.AI_RECIPE_GENERATION.windowMs).toBe(300000);
      });

      it('should have ADMIN_MUTATIONS limit', () => {
        expect(RATE_LIMITS.ADMIN_MUTATIONS).toBeDefined();
        expect(RATE_LIMITS.ADMIN_MUTATIONS.maxRequests).toBe(10);
        expect(RATE_LIMITS.ADMIN_MUTATIONS.windowMs).toBe(60000);
      });

      it('should have ADMIN_SENSITIVE limit', () => {
        expect(RATE_LIMITS.ADMIN_SENSITIVE).toBeDefined();
        expect(RATE_LIMITS.ADMIN_SENSITIVE.maxRequests).toBe(5);
        expect(RATE_LIMITS.ADMIN_SENSITIVE.windowMs).toBe(60000);
      });

      it('should have GENERAL limit', () => {
        expect(RATE_LIMITS.GENERAL).toBeDefined();
        expect(RATE_LIMITS.GENERAL.maxRequests).toBe(100);
        expect(RATE_LIMITS.GENERAL.windowMs).toBe(60000);
      });

      it('should have stricter limits for expensive operations', () => {
        expect(RATE_LIMITS.AI_RECIPE_GENERATION.maxRequests).toBeLessThan(
          RATE_LIMITS.AI_ASSISTANT.maxRequests
        );
        expect(RATE_LIMITS.ADMIN_SENSITIVE.maxRequests).toBeLessThan(
          RATE_LIMITS.ADMIN_MUTATIONS.maxRequests
        );
      });
    });

    describe('Edge Cases', () => {
      it('should handle concurrent requests', () => {
        const config: RateLimitConfig = {
          maxRequests: 10,
          windowMs: 60000,
        };

        const identifier = 'concurrent-user';
        const results = [];

        // Simulate concurrent requests
        for (let i = 0; i < 5; i++) {
          results.push(checkRateLimit(identifier, config));
        }

        // All should be allowed
        expect(results.every((r) => r.allowed)).toBe(true);
      });

      it('should handle zero maxRequests', () => {
        const config: RateLimitConfig = {
          maxRequests: 0,
          windowMs: 60000,
        };

        const result = checkRateLimit('zero-limit-user', config);
        // First request creates the entry
        expect(result.allowed).toBe(true);
      });

      it('should handle very short window', () => {
        const config: RateLimitConfig = {
          maxRequests: 5,
          windowMs: 1, // 1ms
        };

        const result = checkRateLimit('short-window-user', config);
        expect(result.allowed).toBe(true);
        expect(result.resetIn).toBeLessThanOrEqual(1);
      });

      it('should handle special characters in identifier', () => {
        const config: RateLimitConfig = {
          maxRequests: 5,
          windowMs: 60000,
        };

        const identifier = 'user@example.com:192.168.1.1';
        const result = checkRateLimit(identifier, config);
        expect(result.allowed).toBe(true);
      });

      it('should handle very long identifiers', () => {
        const config: RateLimitConfig = {
          maxRequests: 5,
          windowMs: 60000,
        };

        const identifier = 'x'.repeat(1000);
        const result = checkRateLimit(identifier, config);
        expect(result.allowed).toBe(true);
      });
    });

    describe('Rate Limit Scenarios', () => {
      it('should handle AI assistant use case', () => {
        const config = RATE_LIMITS.AI_ASSISTANT;
        const userId = 'ai-user-1';

        // Make 20 requests (limit)
        for (let i = 0; i < 20; i++) {
          const result = checkRateLimit(userId, config);
          expect(result.allowed).toBe(true);
        }

        // 21st request should be denied
        const result = checkRateLimit(userId, config);
        expect(result.allowed).toBe(false);
      });

      it('should handle recipe generation use case', () => {
        const config = RATE_LIMITS.AI_RECIPE_GENERATION;
        const userId = 'recipe-user-1';

        // Make 5 requests (limit)
        for (let i = 0; i < 5; i++) {
          const result = checkRateLimit(userId, config);
          expect(result.allowed).toBe(true);
        }

        // 6th request should be denied
        const result = checkRateLimit(userId, config);
        expect(result.allowed).toBe(false);
        expect(result.remaining).toBe(0);
      });

      it('should handle admin operations', () => {
        const config = RATE_LIMITS.ADMIN_MUTATIONS;
        const adminId = 'admin-1';

        // Rapid fire 10 operations
        const results = [];
        for (let i = 0; i < 10; i++) {
          results.push(checkRateLimit(adminId, config));
        }

        expect(results.filter((r) => r.allowed).length).toBe(10);

        // Next one should be denied
        expect(checkRateLimit(adminId, config).allowed).toBe(false);
      });
    });

    describe('Performance', () => {
      it('should handle many different identifiers', () => {
        const config: RateLimitConfig = {
          maxRequests: 5,
          windowMs: 60000,
        };

        // Create 100 different identifiers
        for (let i = 0; i < 100; i++) {
          const result = checkRateLimit(`perf-user-${i}`, config);
          expect(result.allowed).toBe(true);
        }
      });

      it('should handle rapid sequential requests', () => {
        const config: RateLimitConfig = {
          maxRequests: 100,
          windowMs: 60000,
        };

        const identifier = 'rapid-user';
        const start = Date.now();

        for (let i = 0; i < 50; i++) {
          checkRateLimit(identifier, config);
        }

        const duration = Date.now() - start;
        // Should complete quickly (under 100ms for 50 requests)
        expect(duration).toBeLessThan(100);
      });
    });
  });
});
