/**
 * Retry Strategy
 * Shared retry logic for API calls with exponential backoff
 */

import { logger, isAbortError } from '../utils';

type LogCategory = 'database' | 'api' | 'cache' | 'store' | 'ui' | 'filesystem' | 'poi' | 'navigation' | 'offline' | 'surface';

export interface RetryOptions {
  /** Maximum number of retry attempts (default: 1) */
  maxRetries: number;
  /** Base delay between retries in ms (default: 1000) */
  delayMs: number;
  /** Multiplier for exponential backoff (default: 2) */
  backoffMultiplier: number;
  /** HTTP status codes that should trigger a retry (default: 429, 500+) */
  retryableStatuses: number[];
  /** Abort signal to cancel retries */
  signal?: AbortSignal;
  /** Log category for error logging */
  logCategory?: LogCategory;
}

const DEFAULT_OPTIONS: RetryOptions = {
  maxRetries: 1,
  delayMs: 1000,
  backoffMultiplier: 2,
  retryableStatuses: [429, 500, 502, 503, 504],
  logCategory: 'api',
};

/**
 * Sleep for a given duration, respecting abort signal
 */
function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }

    const timeoutId = setTimeout(resolve, ms);

    if (signal) {
      const abortHandler = () => {
        clearTimeout(timeoutId);
        reject(new DOMException('Aborted', 'AbortError'));
      };
      signal.addEventListener('abort', abortHandler, { once: true });
    }
  });
}

/**
 * Check if a status code should trigger a retry
 */
function isRetryableStatus(status: number, retryableStatuses: number[]): boolean {
  return retryableStatuses.some((retryable) =>
    retryable >= 500 ? status >= 500 : status === retryable
  );
}

/**
 * Execute a fetch function with automatic retry on failure
 *
 * @param fetchFn - Async function that performs the fetch and returns parsed result
 * @param options - Retry configuration options
 * @returns The result of the fetch function
 * @throws Error if all retries are exhausted or abort signal is triggered
 */
export async function fetchWithRetry<T>(
  fetchFn: () => Promise<{ response: Response; result: T }>,
  options?: Partial<RetryOptions>
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error | null = null;
  let delay = opts.delayMs;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    // Check abort before each attempt
    if (opts.signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }

    try {
      const { response, result } = await fetchFn();

      if (response.ok) {
        return result;
      }

      // Check if we should retry this status
      if (
        attempt < opts.maxRetries &&
        isRetryableStatus(response.status, opts.retryableStatuses)
      ) {
        logger.warn(
          opts.logCategory ?? 'api',
          `Request failed with status ${response.status}, retrying in ${delay}ms...`
        );
        await sleep(delay, opts.signal);
        delay *= opts.backoffMultiplier;
        continue;
      }

      // No more retries or non-retryable status
      return result;
    } catch (error: unknown) {
      if (isAbortError(error)) {
        throw error; // Don't retry aborted requests
      }

      lastError = error as Error;

      if (attempt < opts.maxRetries) {
        logger.warn(
          opts.logCategory ?? 'api',
          `Request failed with error, retrying in ${delay}ms...`,
          error
        );
        await sleep(delay, opts.signal);
        delay *= opts.backoffMultiplier;
      }
    }
  }

  // All retries exhausted
  if (lastError) {
    logger.warn(opts.logCategory ?? 'api', 'All retry attempts exhausted', lastError);
  }
  throw lastError ?? new Error('Request failed after all retries');
}

/**
 * Simple retry wrapper for operations that return a result directly
 * (without HTTP response handling)
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  options?: Partial<Omit<RetryOptions, 'retryableStatuses'>>
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error | null = null;
  let delay = opts.delayMs;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    if (opts.signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }

    try {
      return await operation();
    } catch (error: unknown) {
      if (isAbortError(error)) {
        throw error;
      }

      lastError = error as Error;

      if (attempt < opts.maxRetries) {
        logger.warn(
          opts.logCategory ?? 'api',
          `Operation failed, retrying in ${delay}ms...`,
          error
        );
        await sleep(delay, opts.signal);
        delay *= opts.backoffMultiplier;
      }
    }
  }

  throw lastError ?? new Error('Operation failed after all retries');
}
