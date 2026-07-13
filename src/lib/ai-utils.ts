/**
 * Provider-agnostic AI helpers.
 *
 * Replaces the former openai-utils.ts. The per-user API-key feature it also
 * housed was removed with the OpenAI migration: all AI now runs on the single
 * system Gemini key (see ai-config.ts).
 */

export class AIError extends Error {
  constructor(
    message: string,
    public code: 'NO_KEY' | 'INVALID_KEY' | 'API_ERROR' | 'QUOTA_EXCEEDED'
  ) {
    super(message);
    this.name = 'AIError';
  }
}

/**
 * Retry a model call, but fail fast on errors retrying cannot fix
 * (bad credentials, exhausted quota).
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

      const status = error?.status ?? error?.statusCode;

      if (status === 401 || status === 403) {
        throw new AIError(
          'The Gemini API key is invalid or not authorized.',
          'INVALID_KEY'
        );
      }

      if (status === 429) {
        throw new AIError(
          'Gemini rate limit exceeded. Please try again later.',
          'QUOTA_EXCEEDED'
        );
      }

      if (i < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * (i + 1)));
      }
    }
  }

  throw new AIError(
    `AI call failed after ${maxRetries} attempts: ${lastError!.message}`,
    'API_ERROR'
  );
}
