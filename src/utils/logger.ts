export enum LogLevel {
  DEBUG = "DEBUG",
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
  ACTION = "ACTION",
  GUARDRAIL = "GUARDRAIL",
}

export class Logger {
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  private formatMessage(level: LogLevel, message: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` | ${JSON.stringify(meta)}` : "";
    return `[${timestamp}] [${level.padEnd(9)}] [${this.context}] ${message}${metaStr}`;
  }

  debug(message: string, meta?: any) {
    if (process.env.DEBUG === "true" || process.env.LOG_LEVEL === "DEBUG") {
      console.log(`\x1b[90m${this.formatMessage(LogLevel.DEBUG, message, meta)}\x1b[0m`);
    }
  }

  info(message: string, meta?: any) {
    console.log(`\x1b[36m${this.formatMessage(LogLevel.INFO, message, meta)}\x1b[0m`);
  }

  warn(message: string, meta?: any) {
    console.log(`\x1b[33m${this.formatMessage(LogLevel.WARN, message, meta)}\x1b[0m`);
  }

  error(message: string, meta?: any) {
    console.error(`\x1b[31m${this.formatMessage(LogLevel.ERROR, message, meta)}\x1b[0m`);
  }

  action(message: string, meta?: any) {
    console.log(`\x1b[32m\x1b[1m${this.formatMessage(LogLevel.ACTION, message, meta)}\x1b[0m`);
  }

  guardrail(message: string, meta?: any) {
    console.log(`\x1b[35m\x1b[1m${this.formatMessage(LogLevel.GUARDRAIL, message, meta)}\x1b[0m`);
  }
}
