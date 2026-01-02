/**
 * Error Handling Utilities
 * Provides type-safe error handling to eliminate `error: any` patterns
 */

/**
 * Union type representing common error shapes
 */
export type ErrorLike = Error | { message?: string } | string | unknown;

/**
 * Extracts a human-readable error message from various error types
 * @param error - The error to extract a message from
 * @param fallback - Default message if error is unrecognizable
 */
export function getErrorMessage(
  error: ErrorLike,
  fallback = 'An error occurred'
): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message: unknown }).message;
    return typeof message === 'string' ? message : fallback;
  }
  return fallback;
}

/**
 * Type guard to check if an error is an AbortError
 * Useful for ignoring expected abort errors in async operations
 */
export function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}

/**
 * Type guard to check if an error is a timeout error
 * Checks for common timeout error patterns
 */
export function isTimeoutError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return (
    error.message.toLowerCase().includes('timed out') ||
    error.message.toLowerCase().includes('timeout') ||
    error.name === 'TimeoutError'
  );
}

/**
 * Type guard to check if an error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return (
    error.message.toLowerCase().includes('network') ||
    error.message.toLowerCase().includes('failed to fetch') ||
    error.name === 'NetworkError'
  );
}

/**
 * Creates a user-friendly error message based on error type
 * @param error - The error to process
 * @param context - Context to include in the message (e.g., "loading POIs")
 */
export function getUserFriendlyError(
  error: unknown,
  context?: string
): string {
  const prefix = context ? `Error ${context}: ` : '';

  if (isAbortError(error)) {
    return ''; // Abort errors are expected, return empty
  }

  if (isTimeoutError(error)) {
    return `${prefix}Operation timed out. Please try again.`;
  }

  if (isNetworkError(error)) {
    return `${prefix}Network error. Please check your connection.`;
  }

  const message = getErrorMessage(error);
  return `${prefix}${message}`;
}

/**
 * Wraps an async function to handle errors consistently
 * Returns [result, null] on success, [null, error] on failure
 */
export async function tryCatch<T>(
  fn: () => Promise<T>
): Promise<[T, null] | [null, Error]> {
  try {
    const result = await fn();
    return [result, null];
  } catch (error) {
    const err = error instanceof Error ? error : new Error(getErrorMessage(error));
    return [null, err];
  }
}
