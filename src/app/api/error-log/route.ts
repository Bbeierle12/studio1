import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { 
  withErrorHandler, 
  createSuccessResponse, 
  ApiError,
  validateRequestBody 
} from '@/lib/api-utils';

const ErrorLogSchema = z.object({
  error: z.object({
    message: z.string(),
    stack: z.string().optional(),
    name: z.string(),
  }),
  errorInfo: z.object({
    componentStack: z.string(),
  }).optional(),
  url: z.string().url(),
  userAgent: z.string(),
  timestamp: z.string(),
  type: z.string().optional(),
});

type ErrorLogData = z.infer<typeof ErrorLogSchema>;

interface ErrorLogResponse {
  message: string;
  environment?: string;
}

async function handleErrorLog(request: NextRequest) {
  const body = await request.json();
  const errorData = validateRequestBody<ErrorLogData>(ErrorLogSchema, body);

  // In development, just log to console
  if (process.env.NODE_ENV === 'development') {
    console.error('🚨 Client Error Logged:', {
      message: errorData.error.message,
      url: errorData.url,
      timestamp: errorData.timestamp,
      stack: errorData.error.stack,
    });

    const responseData: ErrorLogResponse = {
      message: 'Error logged to console (development mode)',
      environment: 'development',
    };

    return createSuccessResponse(responseData);
  }

  // In production, you would integrate with error tracking services
  // Examples:
  
  // Sentry integration
  // import * as Sentry from '@sentry/nextjs';
  // Sentry.captureException(new Error(errorData.error.message), {
  //   extra: errorData,
  //   tags: {
  //     source: 'client-error-boundary',
  //   },
  // });

  // Log to file system or database
  // await prisma.errorLog.create({
  //   data: {
  //     message: errorData.error.message,
  //     stack: errorData.error.stack,
  //     url: errorData.url,
  //     userAgent: errorData.userAgent,
  //     timestamp: new Date(errorData.timestamp),
  //   },
  // });

  // For now, just log to console in production too
  console.error('Production Client Error:', errorData);

  const responseData: ErrorLogResponse = {
    message: 'Error logged successfully',
    environment: 'production',
  };

  return createSuccessResponse(responseData);
}

// GET method to check error logging endpoint status
async function handleHealthCheck() {
  const responseData = {
    status: 'healthy',
    message: 'Error logging endpoint is working',
    environment: process.env.NODE_ENV,
  };

  return createSuccessResponse(responseData);
}

export const POST = withErrorHandler(handleErrorLog);
export const GET = withErrorHandler(handleHealthCheck);