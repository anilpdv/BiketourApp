/**
 * HTTP Client
 * Unified fetch wrapper with timeout, retry, and error handling
 */

import { ApiError } from './errors';

export interface HttpOptions {
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Number of retry attempts for retryable errors */
  retries?: number;
  /** Custom headers */
  headers?: Record<string, string>;
  /** AbortSignal for request cancellation */
  signal?: AbortSignal;
}

const DEFAULT_TIMEOUT = 10000; // 10 seconds
const DEFAULT_RETRIES = 0;
const RETRY_DELAY = 1000; // 1 second

/**
 * Create an AbortController with timeout
 */
export function createTimeoutController(
  timeoutMs: number,
  existingSignal?: AbortSignal
): { controller: AbortController; cleanup: () => void } {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  // If an existing signal is provided, abort when it does
  if (existingSignal) {
    existingSignal.addEventListener('abort', () => controller.abort());
  }

  return {
    controller,
    cleanup: () => clearTimeout(timeoutId),
  };
}

/**
 * Wait before retrying a request
 */
async function waitForRetry(attempt: number): Promise<void> {
  const delay = RETRY_DELAY * Math.pow(2, attempt - 1); // Exponential backoff
  await new Promise((resolve) => setTimeout(resolve, delay));
}

/**
 * Perform a GET request
 */
export async function httpGet<T>(
  url: string,
  options: HttpOptions = {}
): Promise<T> {
  const { timeout = DEFAULT_TIMEOUT, retries = DEFAULT_RETRIES, headers, signal } = options;

  let lastError: ApiError | undefined;

  for (let attempt = 0; attempt <= retries; attempt++) {
    if (attempt > 0) {
      await waitForRetry(attempt);
    }

    const { controller, cleanup } = createTimeoutController(timeout, signal);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          ...headers,
        },
        signal: controller.signal,
      });

      cleanup();

      if (!response.ok) {
        const error = await ApiError.fromResponse(response);
        if (error.isRetryable && attempt < retries) {
          lastError = error;
          continue;
        }
        throw error;
      }

      return await response.json() as T;
    } catch (error) {
      cleanup();

      if (error instanceof ApiError) {
        if (error.isRetryable && attempt < retries) {
          lastError = error;
          continue;
        }
        throw error;
      }

      const apiError = ApiError.fromError(error);
      if (apiError.isRetryable && attempt < retries) {
        lastError = apiError;
        continue;
      }
      throw apiError;
    }
  }

  throw lastError || new ApiError('UNKNOWN', 0, 'Request failed after retries');
}

/**
 * Perform a POST request
 */
export async function httpPost<T>(
  url: string,
  body: unknown,
  options: HttpOptions = {}
): Promise<T> {
  const { timeout = DEFAULT_TIMEOUT, retries = DEFAULT_RETRIES, headers, signal } = options;

  let lastError: ApiError | undefined;

  for (let attempt = 0; attempt <= retries; attempt++) {
    if (attempt > 0) {
      await waitForRetry(attempt);
    }

    const { controller, cleanup } = createTimeoutController(timeout, signal);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...headers,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      cleanup();

      if (!response.ok) {
        const error = await ApiError.fromResponse(response);
        if (error.isRetryable && attempt < retries) {
          lastError = error;
          continue;
        }
        throw error;
      }

      return await response.json() as T;
    } catch (error) {
      cleanup();

      if (error instanceof ApiError) {
        if (error.isRetryable && attempt < retries) {
          lastError = error;
          continue;
        }
        throw error;
      }

      const apiError = ApiError.fromError(error);
      if (apiError.isRetryable && attempt < retries) {
        lastError = apiError;
        continue;
      }
      throw apiError;
    }
  }

  throw lastError || new ApiError('UNKNOWN', 0, 'Request failed after retries');
}

/**
 * Perform a raw fetch with unified error handling (for non-JSON responses)
 */
export async function httpFetch(
  url: string,
  init: RequestInit = {},
  options: HttpOptions = {}
): Promise<Response> {
  const { timeout = DEFAULT_TIMEOUT, headers, signal } = options;
  const { controller, cleanup } = createTimeoutController(timeout, signal);

  try {
    const response = await fetch(url, {
      ...init,
      headers: {
        ...headers,
        ...init.headers,
      },
      signal: controller.signal,
    });

    cleanup();

    if (!response.ok) {
      throw await ApiError.fromResponse(response);
    }

    return response;
  } catch (error) {
    cleanup();
    if (error instanceof ApiError) {
      throw error;
    }
    throw ApiError.fromError(error);
  }
}

/**
 * Perform a fetch with timeout and optional external abort signal
 * Useful for services that need raw Response handling with consistent timeout behavior
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout: number,
  externalSignal?: AbortSignal
): Promise<Response> {
  const { controller, cleanup } = createTimeoutController(timeout, externalSignal);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    cleanup();
  }
}
