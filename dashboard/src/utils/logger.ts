enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

class Logger {
  private level: LogLevel;
  private context: string;

  constructor(context: string = 'App') {
    this.context = context;
    this.level = process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG;
  }

  private log(level: LogLevel, message: string, data?: any): void {
    if (level > this.level) return;

    const timestamp = new Date().toISOString();
    const levelName = LogLevel[level];
    const logMessage = `[${timestamp}] [${levelName}] [${this.context}] ${message}`;

    switch (level) {
      case LogLevel.ERROR:
        console.error(logMessage, data || '');
        break;
      case LogLevel.WARN:
        console.warn(logMessage, data || '');
        break;
      case LogLevel.INFO:
        console.info(logMessage, data || '');
        break;
      case LogLevel.DEBUG:
        console.log(logMessage, data || '');
        break;
    }
  }

  error(message: string, error?: Error | any): void {
    this.log(LogLevel.ERROR, message, error);
  }

  warn(message: string, data?: any): void {
    this.log(LogLevel.WARN, message, data);
  }

  info(message: string, data?: any): void {
    this.log(LogLevel.INFO, message, data);
  }

  debug(message: string, data?: any): void {
    this.log(LogLevel.DEBUG, message, data);
  }

  child(context: string): Logger {
    return new Logger(`${this.context}:${context}`);
  }
}

export const logger = new Logger();
export { Logger };