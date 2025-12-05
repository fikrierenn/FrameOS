/**
 * Structured Logger
 * 
 * Production-ready logging with context, levels, and future APM integration
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';
type LogContext = Record<string, any>;

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
}

class Logger {
  private context: LogContext = {};

  constructor(defaultContext?: LogContext) {
    this.context = defaultContext || {};
  }

  private log(level: LogLevel, message: string, context?: LogContext, error?: Error) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: { ...this.context, ...context },
      ...(error && {
        error: {
          message: error.message,
          stack: error.stack,
          code: (error as any).code,
        },
      }),
    };

    // Console output (structured JSON in production)
    if (process.env.NODE_ENV === 'production') {
      console[level === 'debug' ? 'log' : level](JSON.stringify(entry));
    } else {
      // Pretty print in development
      const emoji = {
        debug: '🔍',
        info: 'ℹ️',
        warn: '⚠️',
        error: '❌',
      }[level];

      console[level === 'debug' ? 'log' : level](
        `${emoji} [${level.toUpperCase()}] ${message}`,
        context ? context : '',
        error ? error : ''
      );
    }

    // TODO: Send to APM (Sentry, Datadog, etc.)
    // if (process.env.NODE_ENV === 'production') {
    //   await sendToAPM(entry);
    // }
  }

  debug(message: string, context?: LogContext) {
    if (process.env.NODE_ENV !== 'production') {
      this.log('debug', message, context);
    }
  }

  info(message: string, context?: LogContext) {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext) {
    this.log('warn', message, context);
  }

  error(message: string, error?: Error, context?: LogContext) {
    this.log('error', message, context, error);
  }

  /**
   * Create child logger with additional context
   */
  child(context: LogContext): Logger {
    return new Logger({ ...this.context, ...context });
  }
}

export const logger = new Logger();
export { Logger };
