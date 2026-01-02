/**
 * Async State Slice for Zustand Stores
 * Provides reusable loading/error state management
 */

import { StateCreator } from 'zustand';
import { withTimeout } from '../utils/async.utils';
import { isTimeoutError } from '../utils/error.utils';

/**
 * Interface for async state slice
 * Add this to your store's state interface using intersection: YourState & AsyncSlice
 */
export interface AsyncSlice {
  isLoading: boolean;
  error: string | null;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

/**
 * Creates the async slice state and actions
 * Use with Zustand's slice pattern for composable stores
 */
export function createAsyncSlice<T extends AsyncSlice>(): StateCreator<
  T,
  [],
  [],
  AsyncSlice
> {
  return (set) => ({
    isLoading: false,
    error: null,
    setLoading: (isLoading: boolean) => set({ isLoading } as Partial<T>),
    setError: (error: string | null) => set({ error } as Partial<T>),
    clearError: () => set({ error: null } as Partial<T>),
  });
}

/**
 * Options for executeAsync helper
 */
export interface ExecuteAsyncOptions<T> {
  /** Set loading state */
  setLoading: (isLoading: boolean) => void;
  /** Set error state */
  setError: (error: string | null) => void;
  /** Called on successful completion */
  onSuccess?: (result: T) => void;
  /** Custom error message (default: 'An error occurred') */
  errorMessage?: string;
  /** Timeout in milliseconds (default: 15000, 0 to disable) */
  timeoutMs?: number;
}

/**
 * Execute an async operation with standardized loading/error handling
 * Wraps the promise with timeout and handles error states consistently
 *
 * @example
 * ```typescript
 * const result = await executeAsync(
 *   () => fetchData(id),
 *   {
 *     setLoading: (isLoading) => set({ isLoading }),
 *     setError: (error) => set({ error }),
 *     onSuccess: (data) => set({ data }),
 *     errorMessage: 'Failed to fetch data',
 *   }
 * );
 * ```
 */
export async function executeAsync<T>(
  asyncFn: () => Promise<T>,
  options: ExecuteAsyncOptions<T>
): Promise<T | null> {
  const {
    setLoading,
    setError,
    onSuccess,
    errorMessage = 'An error occurred',
    timeoutMs = 15000,
  } = options;

  setLoading(true);
  setError(null);

  try {
    const promise = asyncFn();
    const result =
      timeoutMs > 0
        ? await withTimeout(promise, timeoutMs, 'Operation timed out')
        : await promise;

    onSuccess?.(result);
    setLoading(false);
    return result;
  } catch (error: unknown) {
    const msg = isTimeoutError(error)
      ? 'Operation timed out. Please try again.'
      : errorMessage;
    setError(msg);
    setLoading(false);
    return null;
  }
}
