/**
 * Rate Limiter Utility
 * Creates reusable rate limiters for API calls
 */

export interface RateLimiter {
  /**
   * Wait until enough time has passed since the last request
   */
  waitForRateLimit: () => Promise<void>;
  /**
   * Reset the rate limiter state
   */
  reset: () => void;
}

/**
 * Create a rate limiter that ensures minimum time between requests
 * @param minIntervalMs - Minimum time between requests in milliseconds
 */
export function createRateLimiter(minIntervalMs: number): RateLimiter {
  let lastRequestTime = 0;

  return {
    async waitForRateLimit(): Promise<void> {
      const now = Date.now();
      const timeSinceLastRequest = now - lastRequestTime;
      if (timeSinceLastRequest < minIntervalMs) {
        await new Promise((resolve) =>
          setTimeout(resolve, minIntervalMs - timeSinceLastRequest)
        );
      }
      lastRequestTime = Date.now();
    },
    reset(): void {
      lastRequestTime = 0;
    },
  };
}

/**
 * Simple sleep/delay utility
 * @param ms - Time to sleep in milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
