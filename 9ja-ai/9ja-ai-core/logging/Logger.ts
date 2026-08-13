export interface Logger {
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, context?: Record<string, unknown>): void;
}

export class ConsoleLogger implements Logger {
  public info(message: string, context?: Record<string, unknown>): void {
    console.info(message, context ?? {});
  }

  public warn(message: string, context?: Record<string, unknown>): void {
    console.warn(message, context ?? {});
  }

  public error(message: string, context?: Record<string, unknown>): void {
    console.error(message, context ?? {});
  }
}
