export enum LogLevel {
  DEBUG,
  INFO,
  WARN,
  ERROR
}

class LoggerService {
  private level: LogLevel = import.meta.env.DEV ? LogLevel.DEBUG : LogLevel.WARN;

  constructor() {
    if (import.meta.env.MODE === 'test') {
      this.level = LogLevel.ERROR; // Silence almost everything during tests
    }
  }

  debug(message: string, ...args: unknown[]) {
    if (this.level <= LogLevel.DEBUG) {
      // eslint-disable-next-line no-console
      console.debug(`%c[DEBUG] ${message}`, 'color: #94A3B8', ...args);
    }
  }

  info(message: string, ...args: unknown[]) {
    if (this.level <= LogLevel.INFO) {
      // eslint-disable-next-line no-console
      console.info(`%c[INFO] ${message}`, 'color: #3B82F6', ...args);
    }
  }

  warn(message: string, ...args: unknown[]) {
    if (this.level <= LogLevel.WARN) {
      console.warn(`%c[WARN] ${message}`, 'color: #F59E0B', ...args);
    }
  }

  error(message: string, error?: unknown) {
    if (this.level <= LogLevel.ERROR) {
      console.error(`%c[ERROR] ${message}`, 'color: #EF4444', error || '');
    }
  }

  success(message: string) {
    if (this.level <= LogLevel.INFO) {
      // eslint-disable-next-line no-console
      console.log(`%c[SUCCESS] ${message}`, 'color: #10B981; font-weight: bold');
    }
  }
}

export const Logger = new LoggerService();
