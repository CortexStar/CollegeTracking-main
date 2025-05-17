/**
 * Logger utility for consistent logging across the application
 * 
 * Features:
 * - Environment-based logging levels (more verbose in development)
 * - Production mode suppresses debug logs
 * - Support for different log categories
 * - Timestamps and log level indication
 */

import { env } from './env';

// Define log level types
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// Interface for logger options
interface LoggerOptions {
  category?: string;
  enabledLevels?: LogLevel[];
}

/**
 * Create a logger instance with specified options
 */
export function createLogger(options: LoggerOptions = {}) {
  const {
    category = 'app',
    enabledLevels = ['info', 'warn', 'error'],
  } = options;

  // In development, enable debug logs by default
  const levels = env.NODE_ENV === 'development'
    ? ['debug', ...enabledLevels]
    : enabledLevels;

  const timestamp = () => new Date().toISOString();
  const prefix = (level: LogLevel) => `[${timestamp()}] [${level.toUpperCase()}] [${category}]`;

  return {
    debug: (...args: any[]) => {
      if (levels.includes('debug')) {
        console.debug(prefix('debug'), ...args);
      }
    },
    
    info: (...args: any[]) => {
      if (levels.includes('info')) {
        console.info(prefix('info'), ...args);
      }
    },
    
    warn: (...args: any[]) => {
      if (levels.includes('warn')) {
        console.warn(prefix('warn'), ...args);
      }
    },
    
    error: (...args: any[]) => {
      if (levels.includes('error')) {
        console.error(prefix('error'), ...args);
      }
    }
  };
}

// Default application logger
export const logger = createLogger();

// Create category-specific loggers
export const serverLogger = createLogger({ category: 'server' });
export const dbLogger = createLogger({ category: 'database' });
export const authLogger = createLogger({ category: 'auth' });
export const apiLogger = createLogger({ category: 'api' });