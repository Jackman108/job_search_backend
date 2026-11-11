import type { NextFunction, Request, Response } from 'express';
import { logger } from '../utils/logger.js';

/** Skip noisy probes from health checks / static assets. */
const shouldSkip = (url: string): boolean => {
    const pathOnly = url.split('?')[0] ?? url;
    return pathOnly === '/health' || pathOnly.startsWith('/uploads');
};

/** One-line request access log for the terminal running the API. */
export const requestLoggerMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    if (shouldSkip(req.originalUrl || req.url)) {
        next();
        return;
    }

    const started = Date.now();
    res.on('finish', () => {
        const ms = Date.now() - started;
        const line = `${req.method} ${req.originalUrl || req.url} ${res.statusCode} ${ms}ms`;
        if (res.statusCode >= 500) {
            logger.error(line);
        } else if (res.statusCode >= 400) {
            logger.warn(line);
        } else {
            logger.info(line);
        }
    });
    next();
};
