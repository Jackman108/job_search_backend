import bodyParser from 'body-parser';
import cors, { CorsOptions } from 'cors';
import express from 'express';
import fs from 'fs';
import { DOMAIN_URL, staticPath, uploadDir } from '../config/serverConfig.js';
import { InitializeMiddleware } from '../interface/index.js';

const corsOptions: CorsOptions = {
    origin: DOMAIN_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};

export const CorsMiddleware = (app: express.Application) => app.use(cors(corsOptions));

export const initializeMiddleware: InitializeMiddleware = (app: express.Application) => {
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    app.use(bodyParser.json({ limit: '10mb' }));
    CorsMiddleware(app);

    app.use('/uploads', express.static(staticPath));

    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir);
    }
}; 