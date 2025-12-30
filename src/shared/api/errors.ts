/**
 * API Error Classes
 * Standardized error handling for API requests
 */

export type ApiErrorCode =
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'HTTP_ERROR'
  | 'PARSE_ERROR'
  | 'RATE_LIMITED'
  | 'NOT_FOUND'
  | 'SERVER_ERROR'
  | 'UNKNOWN';

/**
 * Custom API Error class with detailed information
 */
export class ApiError extends Error {
  constructor(
    public readonly code: ApiErrorCode,
    public readonly status: number,
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }

  /**
   * Check if this is a retryable error
   */
  get isRetryable(): boolean {
    return (
      this.code === 'NETWORK_ERROR' ||
      this.code === 'TIMEOUT' ||
      this.code === 'RATE_LIMITED' ||
      (this.status >= 500 && this.status < 600)
    );
  }

  /**
   * Create an ApiError from a fetch Response
   */
  static async fromResponse(response: Response): Promise<ApiError> {
    let code: ApiErrorCode;
    let details: unknown;

    try {
      details = await response.json();
    } catch {
      details = await response.text().catch(() => undefined);
    }

    if (response.status === 404) {
      code = 'NOT_FOUND';
    } else if (response.status === 429) {
      code = 'RATE_LIMITED';
    } else if (response.status >= 500) {
      code = 'SERVER_ERROR';
    } else {
      code = 'HTTP_ERROR';
    }

    return new ApiError(
      code,
      response.status,
      `HTTP ${response.status}: ${response.statusText}`,
      details
    );
  }

  /**
   * Create an ApiError from a caught exception
   */
  static fromError(error: unknown): ApiError {
    if (error instanceof ApiError) {
      return error;
    }

    if (error instanceof TypeError && error.message.includes('fetch')) {
      return new ApiError(
        'NETWORK_ERROR',
        0,
        'Network request failed',
        error.message
      );
    }

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return new ApiError('TIMEOUT', 0, 'Request timed out');
      }
      return new ApiError('UNKNOWN', 0, error.message, error);
    }

    return new ApiError('UNKNOWN', 0, 'An unknown error occurred', error);
  }
}
