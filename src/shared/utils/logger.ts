type LogLevel = 'debug' | 'info' | 'warn' | 'error';
type LogCategory = 'database' | 'api' | 'cache' | 'store' | 'ui' | 'filesystem' | 'poi';

interface LogContext {
  operation?: string;
  [key: string]: unknown;
}

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// In production, only show errors. In development, show all.
const MIN_LOG_LEVEL: LogLevel = __DEV__ ? 'debug' : 'error';

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[MIN_LOG_LEVEL];
}

function formatError(error: unknown): string {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`;
  }
  if (typeof error === 'string') {
    return error;
  }
  return String(error);
}

function formatContext(context?: LogContext): string {
  if (!context || Object.keys(context).length === 0) {
    return '';
  }
  try {
    return ` ${JSON.stringify(context)}`;
  } catch {
    return '';
  }
}

function log(
  level: LogLevel,
  category: LogCategory,
  message: string,
  error?: unknown,
  context?: LogContext
): void {
  if (!shouldLog(level)) {
    return;
  }

  const prefix = `[${level.toUpperCase()}] [${category}]`;
  const errorStr = error ? ` - ${formatError(error)}` : '';
  const contextStr = formatContext(context);
  const fullMessage = `${prefix} ${message}${errorStr}${contextStr}`;

  switch (level) {
    case 'debug':
    case 'info':
      console.log(fullMessage);
      break;
    case 'warn':
      console.warn(fullMessage);
      break;
    case 'error':
      console.error(fullMessage);
      break;
  }
}

export const logger = {
  debug(category: LogCategory, message: string, context?: LogContext): void {
    log('debug', category, message, undefined, context);
  },

  info(category: LogCategory, message: string, context?: LogContext): void {
    log('info', category, message, undefined, context);
  },

  warn(category: LogCategory, message: string, error?: unknown, context?: LogContext): void {
    log('warn', category, message, error, context);
  },

  error(category: LogCategory, message: string, error?: unknown, context?: LogContext): void {
    log('error', category, message, error, context);
  },
};
