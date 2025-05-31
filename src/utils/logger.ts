import { USE_MOCK_PROVIDER } from '@config';

type LogLevel = 'info' | 'warn' | 'error';

class Logger {
    private static formatMessage(level: LogLevel, message: string, meta?: any): string {
        const timestamp = new Date().toISOString();
        const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
        return `[${timestamp}] ${level.toUpperCase()}: ${message}${metaStr}`;
    }

    static info(message: string, meta?: any): void {
        if (USE_MOCK_PROVIDER) {
            console.log(this.formatMessage('info', message, meta));
        }
    }

    static warn(message: string, meta?: any): void {
        if (USE_MOCK_PROVIDER) {
            console.warn(this.formatMessage('warn', message, meta));
        }
    }

    static error(message: string, meta?: any): void {
        if (USE_MOCK_PROVIDER) {
            console.error(this.formatMessage('error', message, meta));
        }
    }
}

export const logger = Logger; 