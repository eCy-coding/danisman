/**
 * Centralized DEV-gated logger with optional Sentry capture for errors.
 * P103: replaces direct console.* across src/* (logger is the single sink).
 */
import * as Sentry from '@sentry/react';

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
    // No-op when Sentry is not initialized; safe to call always.
    if (error instanceof Error) {
      Sentry.captureException(error, { extra: { logMessage: message, ...extra } });
    } else if (error !== undefined) {
      Sentry.captureMessage(`${message}: ${String(error)}`, 'error');
    } else {
      Sentry.captureMessage(message, 'error');
    }
  }

  success(message: string) {
    if (this.level <= LogLevel.INFO) {
      console.log(`%c[SUCCESS] ${message}`, 'color: #10B981; font-weight: bold');
    }
  }
}

export const Logger = new LoggerService();
