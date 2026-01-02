/**
 * Shared cache utilities
 * Provides common caching patterns for repositories
 */

/**
 * Generate a coordinate-based cache key with configurable precision
 * @param lat Latitude
 * @param lon Longitude
 * @param precision Decimal places (default 2 = ~1km)
 */
export function getCoordinateCacheKey(
  lat: number,
  lon: number,
  precision: number = 2
): string {
  return `${lat.toFixed(precision)},${lon.toFixed(precision)}`;
}

/**
 * Create a serialized write queue to prevent database transaction conflicts
 * Returns an object with enqueue method for chaining async operations
 */
export function createWriteQueue() {
  let queue: Promise<void> = Promise.resolve();

  return {
    /**
     * Enqueue an async operation to run after previous operations complete
     * @param operation The async operation to run
     * @param onError Optional error handler (prevents rejecting the queue)
     */
    enqueue(
      operation: () => Promise<void>,
      onError?: (error: unknown) => void
    ): Promise<void> {
      queue = queue.then(operation).catch((error) => {
        onError?.(error);
      });
      return queue;
    },

    /**
     * Get the current queue promise (for awaiting all pending operations)
     */
    get pending(): Promise<void> {
      return queue;
    },
  };
}

/**
 * Type for the write queue returned by createWriteQueue
 */
export type WriteQueue = ReturnType<typeof createWriteQueue>;
