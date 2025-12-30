import { useState, useCallback, useEffect, useRef } from 'react';

export interface UseAsyncDataOptions<T> {
  immediate?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

export interface UseAsyncDataReturn<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  execute: () => Promise<T | null>;
  reset: () => void;
}

/**
 * Hook for managing async data fetching with loading and error states
 *
 * @param asyncFn - Async function that fetches data
 * @param options - Configuration options
 * @returns Object with data, loading state, error, and control functions
 *
 * @example
 * ```tsx
 * const { data, isLoading, error, execute } = useAsyncData(
 *   () => fetchWeather(lat, lon),
 *   { immediate: true }
 * );
 * ```
 */
export function useAsyncData<T>(
  asyncFn: () => Promise<T>,
  options: UseAsyncDataOptions<T> = {}
): UseAsyncDataReturn<T> {
  const { immediate = false, onSuccess, onError } = options;

  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(immediate);
  const [error, setError] = useState<string | null>(null);

  // Track if component is mounted to avoid state updates on unmounted component
  const isMountedRef = useRef(true);

  // Store the latest async function to avoid stale closures
  const asyncFnRef = useRef(asyncFn);
  asyncFnRef.current = asyncFn;

  const execute = useCallback(async (): Promise<T | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await asyncFnRef.current();

      if (isMountedRef.current) {
        setData(result);
        onSuccess?.(result);
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';

      if (isMountedRef.current) {
        setError(errorMessage);
        onError?.(err instanceof Error ? err : new Error(errorMessage));
      }

      return null;
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [onSuccess, onError]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
  }, []);

  // Execute immediately if option is set
  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [immediate, execute]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return {
    data,
    isLoading,
    error,
    execute,
    reset,
  };
}
