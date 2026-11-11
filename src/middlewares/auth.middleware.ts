import { NextFunction, Response } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest } from '@interface';
import { JWT_CONFIG } from '@config';
import { logger } from '@utils';

export const validateUserIdMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.userId) {
        // Auth-required routes: missing/invalid JWT must be 401, not 400/500.
        return res.status(401).json({ message: 'Unauthorized request' });
    }
    next();
};

export const extractUserId = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const authorizationHeader = req.headers.authorization;
        if (!authorizationHeader) {
            logger.warn('Authorization header is missing. The user is not authorized.');
            req.userId = undefined;
            return next();
        }

        const token = authorizationHeader.split(' ')[1];

        if (!token) {
            logger.warn('Token is missing. The user is not authorized.');
            req.userId = undefined;
            return next();
        }

        const secret = JWT_CONFIG.secret;
        if (!secret) {
            return res.status(500).json({ message: 'The secret key was not found' });
        }

        try {
            const decoded = jwt.verify(token, secret) as { id: string };
            if (!decoded || !decoded.id) {
                return res.status(401).json({ message: 'Invalid token' });
            }
            req.userId = decoded.id;
            return next();
        } catch (err: unknown) {
            if (err instanceof jwt.TokenExpiredError) {
                return res.status(401).json({ message: 'Token has expired' });
            }
            // Expected client auth failures (bad signature / malformed) — not server faults.
            const message = err instanceof Error ? err.message : String(err);
            logger.warn('JWT verification failed', { message });
            return res.status(401).json({ message: 'Unauthorized request' });
        }
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        logger.error('extractUserId unexpected error', { message });
        return res.status(401).json({ message: 'Unauthorized request' });
    }
};
