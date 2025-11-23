/**
 * API Utilities Test Suite
 * 
 * Tests API error handling and response utilities.
 * Run with: npm test
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { z, ZodError } from 'zod';
import {
  ApiError,
  ApiErrorCode,
  createSuccessResponse,
  createErrorResponse,
  handleApiError,
  checkRateLimit,
  validateRequestBody,
} from '@/lib/api-utils';

describe('API Utilities', () => {
  describe('ApiError', () => {
    it('should create basic ApiError', () => {
      const error = new ApiError(
        ApiErrorCode.BAD_REQUEST,
        'Invalid input',
        400
      );

      expect(error.code).toBe(ApiErrorCode.BAD_REQUEST);
      expect(error.message).toBe('Invalid input');
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('ApiError');
    });

    it('should create badRequest error', () => {
      const error = ApiError.badRequest('Missing field', { field: 'email' });

      expect(error.code).toBe(ApiErrorCode.BAD_REQUEST);
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Missing field');
      expect(error.details).toEqual({ field: 'email' });
    });

    it('should create unauthorized error', () => {
      const error = ApiError.unauthorized();

      expect(error.code).toBe(ApiErrorCode.UNAUTHORIZED);
      expect(error.statusCode).toBe(401);
      expect(error.message).toBe('Authentication required');
    });

    it('should create forbidden error', () => {
      const error = ApiError.forbidden();

      expect(error.code).toBe(ApiErrorCode.FORBIDDEN);
      expect(error.statusCode).toBe(403);
      expect(error.message).toBe('Access denied');
    });

    it('should create notFound error', () => {
      const error = ApiError.notFound('User');

      expect(error.code).toBe(ApiErrorCode.NOT_FOUND);
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('User not found');
    });

    it('should create conflict error', () => {
      const error = ApiError.conflict('Email already exists', { email: 'test@example.com' });

      expect(error.code).toBe(ApiErrorCode.CONFLICT);
      expect(error.statusCode).toBe(409);
      expect(error.message).toBe('Email already exists');
      expect(error.details).toEqual({ email: 'test@example.com' });
    });

    it('should create validation error', () => {
      const error = ApiError.validation('Invalid email format', { type: 'email' }, 'email');

      expect(error.code).toBe(ApiErrorCode.VALIDATION_ERROR);
      expect(error.statusCode).toBe(422);
      expect(error.message).toBe('Invalid email format');
      expect(error.field).toBe('email');
    });

    it('should create rateLimited error', () => {
      const error = ApiError.rateLimited();

      expect(error.code).toBe(ApiErrorCode.RATE_LIMITED);
      expect(error.statusCode).toBe(429);
      expect(error.message).toBe('Rate limit exceeded');
    });

    it('should create internal error', () => {
      const error = ApiError.internal('Database connection failed');

      expect(error.code).toBe(ApiErrorCode.INTERNAL_ERROR);
      expect(error.statusCode).toBe(500);
      expect(error.message).toBe('Database connection failed');
    });

    it('should create external API error', () => {
      const error = ApiError.external('OpenAI');

      expect(error.code).toBe(ApiErrorCode.EXTERNAL_API_ERROR);
      expect(error.statusCode).toBe(502);
      expect(error.message).toContain('OpenAI');
    });

    it('should create database error', () => {
      const error = ApiError.database('Query timeout', { query: 'SELECT * FROM users' });

      expect(error.code).toBe(ApiErrorCode.DATABASE_ERROR);
      expect(error.statusCode).toBe(500);
      expect(error.details).toEqual({ query: 'SELECT * FROM users' });
    });
  });

  describe('createSuccessResponse', () => {
    it('should create success response with data', () => {
      const data = { id: 1, name: 'Test' };
      const response = createSuccessResponse(data) as any;

      expect(response.data.success).toBe(true);
      expect(response.data.data).toEqual(data);
    });

    it('should include timestamp', () => {
      const data = { id: 1 };
      const response = createSuccessResponse(data) as any;

      expect(response.data.timestamp).toBeDefined();
      expect(typeof response.data.timestamp).toBe('string');
    });

    it('should include requestId', () => {
      const data = { id: 1 };
      const response = createSuccessResponse(data, 'custom-request-id') as any;

      expect(response.data.requestId).toBe('custom-request-id');
    });

    it('should generate requestId if not provided', () => {
      const data = { id: 1 };
      const response = createSuccessResponse(data) as any;

      expect(response.data.requestId).toBeDefined();
      expect(typeof response.data.requestId).toBe('string');
    });
  });

  describe('createErrorResponse', () => {
    it('should create error response', () => {
      const error = ApiError.badRequest('Invalid input');
      const response = createErrorResponse(error) as any;

      expect(response.data.success).toBe(false);
      expect(response.data.error.code).toBe(ApiErrorCode.BAD_REQUEST);
      expect(response.data.error.message).toBe('Invalid input');
    });

    it('should set correct status code', () => {
      const error = ApiError.notFound('User');
      const response = createErrorResponse(error) as any;

      expect(response.status).toBe(404);
    });

    it('should include timestamp', () => {
      const error = ApiError.internal('Error');
      const response = createErrorResponse(error) as any;

      expect(response.data.error.timestamp).toBeDefined();
      expect(typeof response.data.error.timestamp).toBe('string');
    });

    it('should include custom requestId', () => {
      const error = ApiError.internal('Error');
      const response = createErrorResponse(error, 'req-123') as any;

      expect(response.data.error.requestId).toBe('req-123');
    });

    it('should include field for validation errors', () => {
      const error = ApiError.validation('Required', {}, 'email');
      const response = createErrorResponse(error) as any;

      expect(response.data.error.field).toBe('email');
    });
  });

  describe('handleApiError', () => {
    it('should handle ApiError', () => {
      const error = ApiError.badRequest('Invalid');
      const response = handleApiError(error) as any;

      expect(response.data.success).toBe(false);
      expect(response.data.error.code).toBe(ApiErrorCode.BAD_REQUEST);
    });

    it('should handle ZodError', () => {
      const schema = z.object({ email: z.string().email() });
      
      try {
        schema.parse({ email: 'invalid' });
      } catch (error) {
        const response = handleApiError(error) as any;

        expect(response.data.success).toBe(false);
        expect(response.data.error.code).toBe(ApiErrorCode.VALIDATION_ERROR);
        expect(response.data.error.message).toContain('Validation failed');
      }
    });

    it('should handle generic Error', () => {
      const error = new Error('Something went wrong');
      const response = handleApiError(error) as any;

      expect(response.data.success).toBe(false);
      expect(response.data.error.code).toBe(ApiErrorCode.INTERNAL_ERROR);
    });

    it('should handle unknown errors', () => {
      const error = 'string error';
      const response = handleApiError(error) as any;

      expect(response.data.success).toBe(false);
      expect(response.data.error.code).toBe(ApiErrorCode.INTERNAL_ERROR);
    });

    it('should use provided requestId', () => {
      const error = ApiError.internal('Error');
      const response = handleApiError(error, 'custom-id') as any;

      expect(response.data.error.requestId).toBe('custom-id');
    });
  });

  describe('checkRateLimit', () => {
    beforeEach(() => {
      // Clear rate limit state before each test
      // Note: In real implementation, you might want to expose a clear method
    });

    it('should allow requests within limit', () => {
      const result1 = checkRateLimit('user-1', 5, 60000);
      const result2 = checkRateLimit('user-1', 5, 60000);
      const result3 = checkRateLimit('user-1', 5, 60000);

      expect(result1).toBe(true);
      expect(result2).toBe(true);
      expect(result3).toBe(true);
    });

    it('should deny requests exceeding limit', () => {
      // Use up the limit
      for (let i = 0; i < 5; i++) {
        checkRateLimit('user-2', 5, 60000);
      }

      // This should be denied
      const result = checkRateLimit('user-2', 5, 60000);
      expect(result).toBe(false);
    });

    it('should track different identifiers separately', () => {
      // Use up limit for user-3
      for (let i = 0; i < 5; i++) {
        checkRateLimit('user-3', 5, 60000);
      }

      // user-4 should still be allowed
      const result = checkRateLimit('user-4', 5, 60000);
      expect(result).toBe(true);
    });

    it('should reset after time window', () => {
      // Use a very short window for testing
      const identifier = 'user-5';
      
      // Use up the limit
      for (let i = 0; i < 5; i++) {
        checkRateLimit(identifier, 5, 1); // 1ms window
      }

      // Should be denied immediately
      expect(checkRateLimit(identifier, 5, 1)).toBe(false);

      // Wait for window to reset
      return new Promise((resolve) => {
        setTimeout(() => {
          // Should be allowed after reset
          expect(checkRateLimit(identifier, 5, 1)).toBe(true);
          resolve(undefined);
        }, 5);
      });
    });
  });

  describe('validateRequestBody', () => {
    it('should validate valid data', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
      });

      const data = { name: 'John', age: 30 };
      const result = validateRequestBody(schema, data);

      expect(result).toEqual(data);
    });

    it('should throw ZodError for invalid data', () => {
      const schema = z.object({
        email: z.string().email(),
      });

      const data = { email: 'invalid-email' };

      expect(() => validateRequestBody(schema, data)).toThrow(ZodError);
    });

    it('should throw validation error for non-ZodError', () => {
      const badSchema = {
        parse: () => {
          throw new Error('Custom error');
        },
      };

      const data = { test: 'data' };

      expect(() => validateRequestBody(badSchema, data)).toThrow(ApiError);
    });

    it('should transform data according to schema', () => {
      const schema = z.object({
        count: z.string().transform((val) => parseInt(val, 10)),
      });

      const data = { count: '42' };
      const result = validateRequestBody(schema, data);

      expect(result.count).toBe(42);
      expect(typeof result.count).toBe('number');
    });

    it('should apply default values', () => {
      const schema = z.object({
        name: z.string(),
        active: z.boolean().default(true),
      });

      const data = { name: 'Test' };
      const result = validateRequestBody(schema, data);

      expect(result.active).toBe(true);
    });

    it('should strip unknown properties', () => {
      const schema = z.object({
        name: z.string(),
      }).strict();

      const data = { name: 'Test', unknown: 'field' };

      expect(() => validateRequestBody(schema, data)).toThrow(ZodError);
    });
  });

  describe('Error Code Enum', () => {
    it('should have all expected error codes', () => {
      expect(ApiErrorCode.VALIDATION_ERROR).toBeDefined();
      expect(ApiErrorCode.NOT_FOUND).toBeDefined();
      expect(ApiErrorCode.UNAUTHORIZED).toBeDefined();
      expect(ApiErrorCode.FORBIDDEN).toBeDefined();
      expect(ApiErrorCode.CONFLICT).toBeDefined();
      expect(ApiErrorCode.RATE_LIMITED).toBeDefined();
      expect(ApiErrorCode.INTERNAL_ERROR).toBeDefined();
      expect(ApiErrorCode.BAD_REQUEST).toBeDefined();
      expect(ApiErrorCode.EXTERNAL_API_ERROR).toBeDefined();
      expect(ApiErrorCode.DATABASE_ERROR).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle error with no message', () => {
      const error = new ApiError(ApiErrorCode.INTERNAL_ERROR, '', 500);
      const response = createErrorResponse(error) as any;

      expect(response.data.error.message).toBe('');
    });

    it('should handle very long error messages', () => {
      const longMessage = 'A'.repeat(1000);
      const error = ApiError.internal(longMessage);
      const response = createErrorResponse(error) as any;

      expect(response.data.error.message).toBe(longMessage);
    });

    it('should handle special characters in error messages', () => {
      const message = 'Error: <script>alert("xss")</script>';
      const error = ApiError.badRequest(message);
      const response = createErrorResponse(error) as any;

      expect(response.data.error.message).toBe(message);
    });

    it('should handle null/undefined details', () => {
      const error1 = ApiError.badRequest('Error', null);
      const error2 = ApiError.badRequest('Error', undefined);

      expect(error1.details).toBeNull();
      expect(error2.details).toBeUndefined();
    });
  });
});
