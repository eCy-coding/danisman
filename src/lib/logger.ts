/**
 * Centralized DEV-gated logger with optional Sentry capture for errors.
 * P76: Uses lazy sentry.module instead of eager @sentry/react import
 * to keep the 259KB Sentry chunk out of the initial bundle.
 */
import { sentry } from './sentry';

export enum LogLevel {
  DEBUG,
  INFO,
  WARN,
  ERROR,
}

class LoggerService {
  private level: LogLevel = import.meta.env.DEV ? LogLevel.DEBUG : LogLevel.WARN;

  constructor() {
    if (import.meta.env.MODE === 'test') {
      this.level = LogLevel.ERROR;
    }
  }

  debug(message: string, ...args: unknown[]) {
    if (this.level <= LogLevel.DEBUG) {
      console.debug(`%c[DEBUG] ${message}`, 'color: #94A3B8', ...args);
    }
  }

  info(message: string, ...args: unknown[]) {
    if (this.level <= LogLevel.INFO) {
      console.info(`%c[INFO] ${message}`, 'color: #3B82F6', ...args);
    }
  }

  warn(message: string, ...args: unknown[]) {
    if (this.level <= LogLevel.WARN) {
      console.warn(`%c[WARN] ${message}`, 'color: #F59E0B', ...args);
    }
  }

  error(message: string, error?: unknown, extra?: Record<string, unknown>) {
    if (this.level <= LogLevel.ERROR) {
      console.error(`%c[ERROR] ${message}`, 'color: #EF4444', error ?? '', extra ?? '');
    }
    // P76: Access lazy-loaded Sentry module. No-op before sentry.init() completes.
    // Circular import (sentry→logger→sentry) is safe because .module is only
    // accessed at call time, not at module evaluation time.
    const S = sentry.module;
    if (S) {
      if (error instanceof Error) {
        S.captureException(error, { extra: { logMessage: message, ...extra } });
      } else if (error !== undefined) {
        S.captureMessage(`${message}: ${String(error)}`, 'error');
      } else {
        S.captureMessage(message, 'error');
      }
    }
  }

  success(message: string) {
    if (this.level <= LogLevel.INFO) {
      console.log(`%c[SUCCESS] ${message}`, 'color: #10B981; font-weight: bold');
    }
  }
}

export const Logger = new LoggerService();
