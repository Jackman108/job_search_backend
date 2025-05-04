import { NextFunction, Response } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest } from '@interface';
import { JWT_CONFIG } from '@config';

export const validateUserIdMiddleware = (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {
    if (!req.userId) {
        return res.status(400).json({ message: 'userId is required.' });
    }
    next();
};

export const extractUserId = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const authorizationHeader = req.headers.authorization;
        if (!authorizationHeader) {
            console.warn('Authorization header is missing. The user is not authorized.');
            req.userId = undefined;
            return next();
        }

        const token = authorizationHeader.split(' ')[1];

        if (!token) {
            console.warn('Token is missing. The user is not authorized.');
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
            next();
        } catch (err: any) {
            if (err instanceof jwt.TokenExpiredError) {
                return res.status(401).json({ message: 'Token has expired' });
            }
            console.error(err);
            return res.status(401).json({ message: 'Unauthorized request' });
        }

    } catch (err) {
        console.error(err);
        res.status(401).json({ message: 'Unauthorized request' });
    }
}; 