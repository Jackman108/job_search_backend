import { redact } from '../platform/logging/redact.js';
import { shipToSeq, warnSeqConfiguredOnce } from '../platform/logging/seqSink.js';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_ORDER: Record<LogLevel, number> = {
    debug: 10,
    info: 20,
    warn: 30,
    error: 40,
};

const isLogLevel = (value: string): value is LogLevel => value in LEVEL_ORDER;

/** Resolve on each call so dotenv / LOG_LEVEL changes are not frozen at import time. */
const resolveMinLevel = (): LogLevel => {
    const fromEnv = process.env.LOG_LEVEL?.toLowerCase();
    if (fromEnv && isLogLevel(fromEnv)) {
        return fromEnv;
    }
    return process.env.NODE_ENV === 'production' ? 'warn' : 'info';
};

let seqBootHintDone = false;

class Logger {
    private static shouldLog(level: LogLevel): boolean {
        return LEVEL_ORDER[level] >= LEVEL_ORDER[resolveMinLevel()];
    }

    /** `meta` must already be redacted (or undefined). */
    private static formatMessage(level: LogLevel, message: string, meta?: unknown): string {
        const timestamp = new Date().toISOString();
        const metaStr = meta === undefined ? '' : ` ${JSON.stringify(meta)}`;
        return `[${timestamp}] ${level.toUpperCase()}: ${message}${metaStr}`;
    }

    private static emit(level: LogLevel, message: string, meta?: unknown): void {
        if (!this.shouldLog(level)) {
            return;
        }
        if (!seqBootHintDone) {
            seqBootHintDone = true;
            warnSeqConfiguredOnce();
        }
        const safeMeta = meta === undefined ? undefined : redact(meta);
        const line = this.formatMessage(level, message, safeMeta);
        // console.log/warn/error: some Windows/Cursor hosts drop console.info/debug.
        if (level === 'error') {
            console.error(line);
        } else if (level === 'warn') {
            console.warn(line);
        } else {
            console.log(line);
        }
        // E7: optional Seq; never blocks / never upgrades console failure.
        shipToSeq(level, message, safeMeta);
    }

    static debug(message: string, meta?: unknown): void {
        this.emit('debug', message, meta);
    }

    static info(message: string, meta?: unknown): void {
        this.emit('info', message, meta);
    }

    static warn(message: string, meta?: unknown): void {
        this.emit('warn', message, meta);
    }

    static error(message: string, meta?: unknown): void {
        this.emit('error', message, meta);
    }
}

export const logger = Logger;
