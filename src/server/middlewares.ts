// server/middlewares.ts
import bodyParser from 'body-parser';
import cors, {CorsOptions} from 'cors';
import express, {NextFunction, Request, Response} from 'express';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import {DOMAIN_URL, staticPath, uploadDir} from '../config/serverConfig.js';
import {InitializeMiddleware} from '../interface/interface.js';

export interface AuthenticatedRequest extends Request {
    userId?: string;
}

const corsOptions: CorsOptions = {
    origin: DOMAIN_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};

export const CorsMiddleware = (app: express.Application) => app.use(cors(corsOptions));

export const initializeMiddleware: InitializeMiddleware = (app: express.Application) => {
    app.use(express.json({limit: '10mb'}));
    app.use(express.urlencoded({extended: true, limit: '10mb'}));
    app.use(bodyParser.json({limit: '10mb'}));
    CorsMiddleware(app);

    app.use('/uploads', express.static(staticPath));

    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir);
    }
};


export const handleErrors = (res: Response, error: unknown, defaultMessage: string) => {
    console.error(error);
    res.status(500).json({message: defaultMessage});
};



export const extractUserId = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        const secret = process.env.JWT_SECRET
        if (!secret) throw new Error('The secret key was not found');

        if (!token) {
            console.warn('Token is missing. The user is not authorized.');
            req.userId = undefined;
            return next();
        }

        const decoded: any = jwt.verify(token, secret);
        req.userId = decoded.id;
        next();
    } catch (err) {
        console.error(err);
        res.status(401).json({message: 'Unauthorized request'});
    }
};

export const extractUserIdFromToken = (token: string | null): string | null => {
    if (!token) {
        return null;
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET not configured');
    }

    try {
        const decoded: any = jwt.verify(token, secret);
        return decoded.id || null;
    } catch (err) {
        console.error('Invalid token or decoding error:', err);
        return null;
    }
};