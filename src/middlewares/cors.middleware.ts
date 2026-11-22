import cors, { CorsOptions } from 'cors';
import express from 'express';
import fs from 'fs';
import { URLS, BASE_PATHS } from '@config';
import { InitializeMiddleware } from '../interface/index.js';
import { requestLoggerMiddleware } from './requestLogger.middleware.js';
import { securityHeadersMiddleware } from './securityHeaders.middleware.js';

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

/** JSON body cap — webhooks/avatars stay under this; was 10mb with a double parser. */
const JSON_LIMIT = process.env.JSON_BODY_LIMIT || '1mb';

export const initializeMiddleware: InitializeMiddleware = (app: express.Application) => {
    app.use(securityHeadersMiddleware);
    app.use(requestLoggerMiddleware);
    // Single JSON parser (removed duplicate bodyParser.json).
    app.use(express.json({ limit: JSON_LIMIT, verify: captureWebhookRawBody }));
    app.use(express.urlencoded({ extended: true, limit: JSON_LIMIT }));
    CorsMiddleware(app);

    app.use('/uploads', express.static(BASE_PATHS.static, { fallthrough: true }));

    if (!fs.existsSync(BASE_PATHS.uploads)) {
        fs.mkdirSync(BASE_PATHS.uploads, { recursive: true });
    }
};
