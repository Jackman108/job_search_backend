// server/middlewares.ts
import bodyParser from 'body-parser';
import cors, { CorsOptions } from 'cors';
import express, { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import { InitializeMiddleware } from '../interface/interface.js';
import { DOMAIN_URL, staticPath, uploadDir } from '../config/serverConfig.js';
import jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
    userId?: string;
}

export const initializeMiddleware: InitializeMiddleware = (app: express.Application) => {
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    app.use(bodyParser.json({ limit: '10mb' }));

    const corsOptions: CorsOptions = {
        origin: DOMAIN_URL,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization']
    };

    app.use(cors(corsOptions));

    app.use('/uploads', express.static(staticPath));

    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir);
    }
};

export const handleErrors = (res: Response, error: unknown, defaultMessage: string) => {
    console.error(error);
    res.status(500).json({ message: defaultMessage });
};

export const validateUserId = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.userId) {
        return res.status(400).json({ message: 'userId is required.' });
    }
    next();
};
export const validateUserPatch = (req: Request, res: Response, next: NextFunction) => {
    if (!req.params.userId) {
        return res.status(400).json({ message: 'userId is required.' });
    }
    next();
};
export const validateDataPresence = (req: Request, res: Response, keys: string[]) => {
    for (const key of keys) {
        if (!req.body[key]) {
            return res.status(400).json({ message: `${key} is required.` });
        }
    }
};

export const extractUserId = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) throw new Error('Токен отсутствует');

        const secret = process.env.JWT_SECRET
        if (!secret) throw new Error('Секретный ключ не найден');

        const decoded: any = jwt.verify(token, secret);
        req.userId = decoded.id;
        next();
    } catch (err) {
        console.error(err);
        res.status(401).json({ message: 'Неавторизованный запрос' });
    }
};