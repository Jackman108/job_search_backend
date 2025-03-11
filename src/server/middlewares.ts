// server/middlewares.ts
import bodyParser from 'body-parser';
import cors, {CorsOptions} from 'cors';
import express, {NextFunction, Response} from 'express';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import {DOMAIN_URL, staticPath, uploadDir} from '../config/serverConfig.js';
import {AuthenticatedRequest, InitializeMiddleware} from '../interface/interface.js';

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

export const validateUserIdMiddleware = (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {
    if (!req.userId) {
        return res.status(400).json({message: 'userId is required.'});
    }
    next();
};

export const handleSuccess = (res: Response, message: string = 'Success', data?: any) => {
    res.status(200).json({success: true, message, data,});
};

export const handleErrors = (res: Response, error: unknown, defaultMessage: string) => {
    console.error(error);
    res.status(500).json({success: false, message: defaultMessage});
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

        const secret = process.env.JWT_SECRET
        if (!secret) {
            return res.status(500).json({message: 'The secret key was not found'});
        }
        try {
            const decoded = jwt.verify(token, secret) as { id: string };
            if (!decoded || !decoded.id) {
                return res.status(401).json({message: 'Invalid token'});
            }
            req.userId = decoded.id;
            next();
        } catch (err: any) {
            if (err instanceof jwt.TokenExpiredError) {
                return res.status(401).json({message: 'Token has expired'});
            }
            console.error(err);
            return res.status(401).json({message: 'Unauthorized request'});
        }

    } catch (err) {
        console.error(err);
        res.status(401).json({message: 'Unauthorized request'});
    }
};

export function registerRoute(
    app: express.Application,
    method: 'get' | 'post' | 'put' | 'delete' | 'patch',
    path: string,
    controller: any,
    action: string,
    requiresAuth = true,
) {

    const middlewares = [extractUserId];
    if (requiresAuth) {
        middlewares.push(validateUserIdMiddleware);
    }

    app[method](path, ...middlewares, (req: AuthenticatedRequest, res: Response) => {
        const controllerInstance = new controller();
        controllerInstance[action](req, res);
    });
}

