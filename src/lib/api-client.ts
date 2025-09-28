import { ApiResponse, ApiErrorResponse } from '@/lib/api-utils';

// Custom error class for API client errors
export class ApiClientError extends Error {
  public readonly status: number;
  public readonly code?: string;
  public readonly details?: any;

  constructor(message: string, status: number, code?: string, details?: any) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

// API client configuration
export interface ApiClientConfig {
  baseUrl?: string;
  timeout?: number;
  headers?: Record<string, string>;
}

// Request options
export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  timeout?: number;
}

// Default configuration
const defaultConfig: Required<ApiClientConfig> = {
  baseUrl: '',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
};

class ApiClient {
  private config: Required<ApiClientConfig>;

  constructor(config: ApiClientConfig = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestOptions & { body?: any } = {}
  ): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`;
    const timeout = options.timeout || this.config.timeout;

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        method: options.method || 'GET',
        headers: {
          ...this.config.headers,
          ...options.headers,
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle different response types
      const contentType = response.headers.get('Content-Type');
      let data: any;

      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      // Check if response is successful
      if (!response.ok) {
        // Handle standardized API error response
        if (data && typeof data === 'object' && 'error' in data) {
          const apiError = data as ApiErrorResponse;
          throw new ApiClientError(
            apiError.error.message,
            response.status,
            apiError.error.code,
            apiError.error.details
          );
        }

        // Handle non-standardized error response
        throw new ApiClientError(
          data?.message || `HTTP ${response.status}: ${response.statusText}`,
          response.status
        );
      }

      // Return successful response data
      if (data && typeof data === 'object' && 'success' in data && data.success) {
        const apiResponse = data as ApiResponse<T>;
        return 'data' in apiResponse ? apiResponse.data : data;
      }

      // Return raw data if not in standard format
      return data;

    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof ApiClientError) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new ApiClientError('Request timeout', 408);
        }

        throw new ApiClientError(
          `Request failed: ${error.message}`,
          0,
          'NETWORK_ERROR'
        );
      }

      throw new ApiClientError('Unknown error occurred', 0);
    }
  }

  // GET request
  async get<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    return this.makeRequest<T>(endpoint, { ...options, method: 'GET' });
  }

  // POST request
  async post<T = any>(
    endpoint: string,
    body?: any,
    options: RequestOptions = {}
  ): Promise<T> {
    return this.makeRequest<T>(endpoint, { ...options, method: 'POST', body });
  }

  // PUT request
  async put<T = any>(
    endpoint: string,
    body?: any,
    options: RequestOptions = {}
  ): Promise<T> {
    return this.makeRequest<T>(endpoint, { ...options, method: 'PUT', body });
  }

  // DELETE request
  async delete<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    return this.makeRequest<T>(endpoint, { ...options, method: 'DELETE' });
  }

  // PATCH request
  async patch<T = any>(
    endpoint: string,
    body?: any,
    options: RequestOptions = {}
  ): Promise<T> {
    return this.makeRequest<T>(endpoint, { ...options, method: 'PATCH', body });
  }

  // Upload file
  async upload<T = any>(
    endpoint: string,
    file: File,
    options: Omit<RequestOptions, 'headers'> & { 
      additionalData?: Record<string, any>;
      onProgress?: (progress: number) => void;
    } = {}
  ): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);

    if (options.additionalData) {
      Object.entries(options.additionalData).forEach(([key, value]) => {
        formData.append(key, JSON.stringify(value));
      });
    }

    // Remove Content-Type header to let browser set it for multipart/form-data
    const headers = { ...this.config.headers };
    delete headers['Content-Type'];

    return this.makeRequest<T>(endpoint, {
      ...options,
      method: 'POST',
      headers,
      body: formData,
    });
  }
}

// Create default API client instance
export const apiClient = new ApiClient();

// Create API client with authentication
export function createAuthenticatedApiClient(token: string): ApiClient {
  return new ApiClient({
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });
}

// Specific API methods for your application
export const api = {
  // Cooking assistant
  askCookingQuestion: (question: string, context?: string) =>
    apiClient.post<{ answer: string; context?: string; fallback?: boolean }>(
      '/api/cooking-assistant',
      { question, context }
    ),

  // Error logging
  logError: (errorData: any) =>
    apiClient.post<{ message: string }>('/api/error-log', errorData),

  // Health check
  checkHealth: () =>
    apiClient.get<{ status: string; message: string }>('/api/error-log'),
};

// React hook for API calls with loading and error states
import { useState, useCallback } from 'react';

export function useApiCall<TData = any, TError = ApiClientError>() {
  const [data, setData] = useState<TData | null>(null);
  const [error, setError] = useState<TError | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const execute = useCallback(async (apiCall: () => Promise<TData>) => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await apiCall();
      setData(result);
      return result;
    } catch (err) {
      const error = err as TError;
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    data,
    error,
    isLoading,
    execute,
    reset,
  };
}