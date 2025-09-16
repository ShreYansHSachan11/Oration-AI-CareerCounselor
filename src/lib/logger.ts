/**
 * Production Logging Utility
 * Provides structured logging for production monitoring
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

class Logger {
  private logLevel: LogLevel;
  private enableRequestLogging: boolean;

  constructor() {
    this.logLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';
    this.enableRequestLogging = process.env.ENABLE_REQUEST_LOGGING === 'true';
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
    };

    return levels[level] >= levels[this.logLevel];
  }

  private formatLogEntry(entry: LogEntry): string {
    if (process.env.NODE_ENV === 'production') {
      // JSON format for production log aggregation
      return JSON.stringify(entry);
    } else {
      // Human-readable format for development
      const { timestamp, level, message, context, error } = entry;
      let formatted = `[${timestamp}] ${level.toUpperCase()}: ${message}`;

      if (context && Object.keys(context).length > 0) {
        formatted += ` | Context: ${JSON.stringify(context)}`;
      }

      if (error) {
        formatted += ` | Error: ${error.message}`;
        if (error.stack) {
          formatted += `\n${error.stack}`;
        }
      }

      return formatted;
    }
  }

  private log(
    level: LogLevel,
    message: string,
    context?: Record<string, any>,
    error?: Error
  ): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    const formatted = this.formatLogEntry(entry);

    switch (level) {
      case 'debug':
        console.debug(formatted);
        break;
      case 'info':
        console.info(formatted);
        break;
      case 'warn':
        console.warn(formatted);
        break;
      case 'error':
        console.error(formatted);
        break;
    }
  }

  debug(message: string, context?: Record<string, any>): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: Record<string, any>): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, any>): void {
    this.log('warn', message, context);
  }

  error(message: string, error?: Error, context?: Record<string, any>): void {
    this.log('error', message, context, error);
  }

  // Request logging for API monitoring
  logRequest(
    req: {
      method: string;
      url: string;
      headers: Record<string, string | string[] | undefined>;
      userId?: string;
    },
    duration?: number
  ): void {
    if (!this.enableRequestLogging) return;

    const context = {
      method: req.method,
      url: req.url,
      userAgent: req.headers['user-agent'],
      ip: req.headers['x-forwarded-for'] || req.headers['x-real-ip'],
      userId: req.userId,
      duration: duration ? `${duration}ms` : undefined,
    };

    this.info('API Request', context);
  }

  // Database operation logging
  logDatabaseOperation(
    operation: string,
    table: string,
    duration: number,
    error?: Error
  ): void {
    const context = {
      operation,
      table,
      duration: `${duration}ms`,
    };

    if (error) {
      this.error(
        `Database operation failed: ${operation} on ${table}`,
        error,
        context
      );
    } else {
      this.debug(`Database operation: ${operation} on ${table}`, context);
    }
  }

  // AI service logging
  logAIRequest(
    model: string,
    tokens: number,
    duration: number,
    error?: Error
  ): void {
    const context = {
      model,
      tokens,
      duration: `${duration}ms`,
    };

    if (error) {
      this.error('AI request failed', error, context);
    } else {
      this.info('AI request completed', context);
    }
  }

  // Authentication logging
  logAuth(
    event: 'login' | 'logout' | 'signup' | 'error',
    userId?: string,
    provider?: string,
    error?: Error
  ): void {
    const context = {
      event,
      userId,
      provider,
    };

    if (error) {
      this.error(`Authentication ${event} failed`, error, context);
    } else {
      this.info(`Authentication ${event}`, context);
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Export middleware for request logging
export function createRequestLogger() {
  return (req: any, res: any, next: any) => {
    const start = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - start;
      logger.logRequest(req, duration);
    });

    next();
  };
}
