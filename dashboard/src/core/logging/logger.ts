import { config } from '../config';

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

interface LogContext {
  [key: string]: any;
}

interface LogEntry {
  timestamp: string;
  level: string;
  context: string;
  message: string;
  requestId?: string;
  data?: LogContext;
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
}

export class Logger {
  private level: LogLevel;
  private context: string;
  private requestId?: string;

  constructor(context: string = 'App', requestId?: string) {
    this.context = context;
    this.requestId = requestId;
    
    // Set log level based on config
    const configLevel = config.monitoring.logLevel;
    switch (configLevel) {
      case 'error':
        this.level = LogLevel.ERROR;
        break;
      case 'warn':
        this.level = LogLevel.WARN;
        break;
      case 'debug':
        this.level = LogLevel.DEBUG;
        break;
      default:
        this.level = LogLevel.INFO;
    }
  }

  private formatLog(level: LogLevel, message: string, data?: any): LogEntry | string {
    const levelName = LogLevel[level];
    
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: levelName,
      context: this.context,
      message,
    };

    if (this.requestId) {
      logEntry.requestId = this.requestId;
    }

    // Handle error objects specially
    if (data instanceof Error) {
      logEntry.error = {
        message: data.message,
        stack: data.stack,
        code: (data as any).code,
      };
    } else if (data !== undefined) {
      logEntry.data = data;
    }

    // Format based on config
    if (config.monitoring.logFormat === 'json') {
      return JSON.stringify(logEntry);
    } else {
      // Pretty format for development
      let output = `[${logEntry.timestamp}] [${levelName}] [${this.context}]`;
      if (this.requestId) {
        output += ` [${this.requestId}]`;
      }
      output += ` ${message}`;
      
      if (logEntry.error) {
        output += `\n  Error: ${logEntry.error.message}`;
        if (logEntry.error.stack && this.level >= LogLevel.DEBUG) {
          output += `\n  Stack: ${logEntry.error.stack}`;
        }
      } else if (logEntry.data) {
        output += `\n  Data: ${JSON.stringify(logEntry.data, null, 2)}`;
      }
      
      return output;
    }
  }

  private log(level: LogLevel, message: string, data?: any): void {
    if (level > this.level) return;

    const formatted = this.formatLog(level, message, data);
    
    switch (level) {
      case LogLevel.ERROR:
        console.error(formatted);
        break;
      case LogLevel.WARN:
        console.warn(formatted);
        break;
      case LogLevel.INFO:
        console.info(formatted);
        break;
      case LogLevel.DEBUG:
        console.log(formatted);
        break;
    }
  }

  error(message: string, error?: Error | any): void {
    this.log(LogLevel.ERROR, message, error);
  }

  warn(message: string, data?: LogContext): void {
    this.log(LogLevel.WARN, message, data);
  }

  info(message: string, data?: LogContext): void {
    this.log(LogLevel.INFO, message, data);
  }

  debug(message: string, data?: LogContext): void {
    this.log(LogLevel.DEBUG, message, data);
  }

  child(context: string, requestId?: string): Logger {
    const childContext = `${this.context}:${context}`;
    return new Logger(childContext, requestId || this.requestId);
  }

  withRequestId(requestId: string): Logger {
    return new Logger(this.context, requestId);
  }
}

// Create singleton instance
let loggerInstance: Logger | null = null;

export function getLogger(): Logger {
  if (!loggerInstance) {
    loggerInstance = new Logger();
  }
  return loggerInstance;
}

// Export convenience instance
export const logger = getLogger();