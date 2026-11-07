import { NextFunction, Request, Response } from 'express';
import { logger } from '@utils';

type HttpError = Error & { status?: number; statusCode?: number };

export const errorMiddleware = (err: HttpError, req: Request, res: Response, next: NextFunction): void => {
    const status = err.status ?? err.statusCode ?? 500;
    logger.error(err.message || 'Unhandled request error', {
        path: req.path,
        method: req.method,
        status,
        stack: err.stack,
    });

    if (res.headersSent) {
        next(err);
        return;
    }

    res.status(status).json({
        success: false,
        message: status >= 500 ? 'Internal server error' : err.message,
    });
};
