import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

// Standard error codes
export enum ApiErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  CONFLICT = 'CONFLICT',
  RATE_LIMITED = 'RATE_LIMITED',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  BAD_REQUEST = 'BAD_REQUEST',
  EXTERNAL_API_ERROR = 'EXTERNAL_API_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
}

// Standard error response interface
export interface ApiErrorResponse {
  success: false;
  error: {
    code: ApiErrorCode;
    message: string;
    details?: any;
    field?: string;
    timestamp: string;
    requestId?: string;
  };
}

export interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
  timestamp: string;
  requestId?: string;
}

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

// Custom API error class
export class ApiError extends Error {
  public readonly code: ApiErrorCode;
  public readonly statusCode: number;
  public readonly details?: any;
  public readonly field?: string;

  constructor(
    code: ApiErrorCode,
    message: string,
    statusCode: number = 500,
    details?: any,
    field?: string
  ) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.field = field;
  }

  static badRequest(message: string, details?: any, field?: string): ApiError {
    return new ApiError(ApiErrorCode.BAD_REQUEST, message, 400, details, field);
  }

  static unauthorized(message: string = 'Authentication required'): ApiError {
    return new ApiError(ApiErrorCode.UNAUTHORIZED, message, 401);
  }

  static forbidden(message: string = 'Access denied'): ApiError {
    return new ApiError(ApiErrorCode.FORBIDDEN, message, 403);
  }

  static notFound(resource: string = 'Resource'): ApiError {
    return new ApiError(ApiErrorCode.NOT_FOUND, `${resource} not found`, 404);
  }

  static conflict(message: string, details?: any): ApiError {
    return new ApiError(ApiErrorCode.CONFLICT, message, 409, details);
  }

  static validation(message: string, details?: any, field?: string): ApiError {
    return new ApiError(ApiErrorCode.VALIDATION_ERROR, message, 422, details, field);
  }

  static rateLimited(message: string = 'Rate limit exceeded'): ApiError {
    return new ApiError(ApiErrorCode.RATE_LIMITED, message, 429);
  }

  static internal(message: string = 'Internal server error', details?: any): ApiError {
    return new ApiError(ApiErrorCode.INTERNAL_ERROR, message, 500, details);
  }

  static external(service: string, message?: string): ApiError {
    return new ApiError(
      ApiErrorCode.EXTERNAL_API_ERROR,
      message || `External service ${service} is unavailable`,
      502
    );
  }

  static database(message: string = 'Database error', details?: any): ApiError {
    return new ApiError(ApiErrorCode.DATABASE_ERROR, message, 500, details);
  }
}

// Generate unique request ID
function generateRequestId(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

// Success response helper
export function createSuccessResponse<T>(
  data: T,
  requestId?: string
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json({
    success: true,
    data,
    timestamp: new Date().toISOString(),
    requestId: requestId || generateRequestId(),
  });
}

// Error response helper
export function createErrorResponse(
  error: ApiError,
  requestId?: string
): NextResponse<ApiErrorResponse> {
  // Don't expose sensitive error details in production
  const details = process.env.NODE_ENV === 'development' ? error.details : undefined;

  return NextResponse.json(
    {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details,
        field: error.field,
        timestamp: new Date().toISOString(),
        requestId: requestId || generateRequestId(),
      },
    },
    { status: error.statusCode }
  );
}

// Main error handler function
export function handleApiError(error: unknown, requestId?: string): NextResponse<ApiErrorResponse> {
  console.error('API Error:', error);

  // Handle known error types
  if (error instanceof ApiError) {
    return createErrorResponse(error, requestId);
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const firstError = error.errors[0];
    return createErrorResponse(
      ApiError.validation(
        `Validation failed: ${firstError.message}`,
        error.errors,
        firstError.path.join('.')
      ),
      requestId
    );
  }

  // Handle Prisma errors
  if (error instanceof PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        return createErrorResponse(
          ApiError.conflict('A record with this value already exists', {
            prismaCode: error.code,
            target: error.meta?.target,
          }),
          requestId
        );
      case 'P2025':
        return createErrorResponse(ApiError.notFound('Record'), requestId);
      default:
        return createErrorResponse(
          ApiError.database('Database operation failed', {
            prismaCode: error.code,
            message: error.message,
          }),
          requestId
        );
    }
  }

  // Handle generic errors
  if (error instanceof Error) {
    return createErrorResponse(
      ApiError.internal('An unexpected error occurred', {
        message: process.env.NODE_ENV === 'development' ? error.message : undefined,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      }),
      requestId
    );
  }

  // Handle unknown errors
  return createErrorResponse(
    ApiError.internal('An unknown error occurred'),
    requestId
  );
}

// Async error wrapper for API routes
export function withErrorHandler<T extends any[], R>(
  handler: (...args: T) => Promise<NextResponse<R>>
) {
  return async (...args: T): Promise<NextResponse<R | ApiErrorResponse>> => {
    const requestId = generateRequestId();
    
    try {
      return await handler(...args);
    } catch (error) {
      return handleApiError(error, requestId);
    }
  };
}

// Middleware to add request ID to request headers
export function withRequestId(request: Request): string {
  const requestId = generateRequestId();
  // You can add this to request headers if needed
  return requestId;
}

// Rate limiting helper (simple in-memory implementation)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  identifier: string,
  limit: number = 100,
  windowMs: number = 60000
): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= limit) {
    return false;
  }

  record.count++;
  return true;
}

// Validation helper
export function validateRequestBody<T>(
  schema: any,
  body: unknown
): T {
  try {
    return schema.parse(body);
  } catch (error) {
    if (error instanceof ZodError) {
      throw error; // Will be handled by handleApiError
    }
    throw ApiError.validation('Invalid request body');
  }
}