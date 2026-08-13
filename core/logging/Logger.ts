/**
 * Logger.ts
 *
 * Structured logging interface for the 9JA AI core. All engines, providers,
 * and services emit log entries through this interface so that the underlying
 * transport (console, file, cloud logging) can be swapped without touching
 * engine code.
 *
 * TODO Phase 2: Implement ConsoleLogger (default development transport)
 * TODO Phase 3: Implement CloudLogger (Google Cloud Logging / AWS CloudWatch)
 * TODO Phase 3: Add log sampling for high-volume debug events
 */

// ---------------------------------------------------------------------------
// Log levels
// ---------------------------------------------------------------------------

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

// ---------------------------------------------------------------------------
// Log entry shape
// ---------------------------------------------------------------------------

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  service?: string;         // e.g. "LanguageEngine", "OpenAIProvider"
  requestId?: string;       // trace ID across a single user request
  userId?: string;
  sessionId?: string;
  durationMs?: number;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  data?: Record<string, unknown>;  // arbitrary structured context
}

// ---------------------------------------------------------------------------
// Logger interface
// ---------------------------------------------------------------------------

export interface Logger {
  debug(message: string, data?: Record<string, unknown>): void;
  info(message: string, data?: Record<string, unknown>): void;
  warn(message: string, data?: Record<string, unknown>): void;
  error(message: string, error?: Error, data?: Record<string, unknown>): void;
  fatal(message: string, error?: Error, data?: Record<string, unknown>): void;

  /**
   * Create a child logger that automatically includes the given context fields
   * in every log entry. Useful for request-scoped logging.
   */
  child(context: Partial<Pick<LogEntry, 'service' | 'requestId' | 'userId' | 'sessionId'>>): Logger;

  /**
   * Emit a fully constructed log entry (used by transports internally).
   */
  log(entry: LogEntry): void;
}

// ---------------------------------------------------------------------------
// No-op logger (useful for tests and scaffolding)
// ---------------------------------------------------------------------------

export class NoopLogger implements Logger {
  debug(_m: string, _d?: Record<string, unknown>): void {}
  info(_m: string, _d?: Record<string, unknown>): void {}
  warn(_m: string, _d?: Record<string, unknown>): void {}
  error(_m: string, _e?: Error, _d?: Record<string, unknown>): void {}
  fatal(_m: string, _e?: Error, _d?: Record<string, unknown>): void {}
  log(_entry: LogEntry): void {}
  child(_ctx: Partial<Pick<LogEntry, 'service' | 'requestId' | 'userId' | 'sessionId'>>): Logger {
    return this;
  }
}

// ---------------------------------------------------------------------------
// Global logger factory (replace with real implementation in Phase 2)
// ---------------------------------------------------------------------------

let _globalLogger: Logger = new NoopLogger();

export function getLogger(): Logger {
  return _globalLogger;
}

export function setLogger(logger: Logger): void {
  _globalLogger = logger;
}
