import bodyParser from 'body-parser';
import cors, { CorsOptions } from 'cors';
import express from 'express';
import fs from 'fs';
import { URLS, BASE_PATHS } from '@config';
import { InitializeMiddleware } from '../interface/index.js';
import { requestLoggerMiddleware } from './requestLogger.middleware.js';

const corsOptions: CorsOptions = {
    origin: URLS.domain,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};

export const CorsMiddleware = (app: express.Application) => app.use(cors(corsOptions));

const captureWebhookRawBody = (req: express.Request, _res: express.Response, buf: Buffer) => {
    const url = req.originalUrl || req.url || '';
    if (url.includes('/webhook/')) {
        (req as express.Request & { rawBody?: string }).rawBody = buf.toString('utf8');
    }
};

export const initializeMiddleware: InitializeMiddleware = (app: express.Application) => {
    app.use(requestLoggerMiddleware);
    app.use(express.json({ limit: '10mb', verify: captureWebhookRawBody }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    app.use(bodyParser.json({ limit: '10mb', verify: captureWebhookRawBody }));
    CorsMiddleware(app);

    app.use('/uploads', express.static(BASE_PATHS.static));

    if (!fs.existsSync(BASE_PATHS.uploads)) {
        fs.mkdirSync(BASE_PATHS.uploads);
    }
};
