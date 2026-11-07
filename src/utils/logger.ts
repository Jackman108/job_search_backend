type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_ORDER: Record<LogLevel, number> = {
    debug: 10,
    info: 20,
    warn: 30,
    error: 40,
};

const isLogLevel = (value: string): value is LogLevel => value in LEVEL_ORDER;

const resolveMinLevel = (): LogLevel => {
    const fromEnv = process.env.LOG_LEVEL?.toLowerCase();
    if (fromEnv && isLogLevel(fromEnv)) {
        return fromEnv;
    }
    return process.env.NODE_ENV === 'production' ? 'warn' : 'info';
};

class Logger {
    private static minLevel: LogLevel = resolveMinLevel();

    private static shouldLog(level: LogLevel): boolean {
        return LEVEL_ORDER[level] >= LEVEL_ORDER[this.minLevel];
    }

    private static formatMessage(level: LogLevel, message: string, meta?: unknown): string {
        const timestamp = new Date().toISOString();
        const metaStr = meta === undefined ? '' : ` ${JSON.stringify(meta)}`;
        return `[${timestamp}] ${level.toUpperCase()}: ${message}${metaStr}`;
    }

    static debug(message: string, meta?: unknown): void {
        if (this.shouldLog('debug')) {
            console.debug(this.formatMessage('debug', message, meta));
        }
    }

    static info(message: string, meta?: unknown): void {
        if (this.shouldLog('info')) {
            console.info(this.formatMessage('info', message, meta));
        }
    }

    static warn(message: string, meta?: unknown): void {
        if (this.shouldLog('warn')) {
            console.warn(this.formatMessage('warn', message, meta));
        }
    }

    static error(message: string, meta?: unknown): void {
        if (this.shouldLog('error')) {
            console.error(this.formatMessage('error', message, meta));
        }
    }
}

export const logger = Logger;
