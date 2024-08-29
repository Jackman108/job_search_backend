// server/middlewares.ts
import bodyParser from 'body-parser';
import cors, { CorsOptions } from 'cors';
import express from 'express';
import fs from 'fs';
import { InitializeMiddleware } from '../interface/interface.js';
import { DOMAIN_URL, staticPath, uploadDir } from '../config/serverConfig.js';


export const initializeMiddleware: InitializeMiddleware = (app: express.Application) => {
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    app.use(bodyParser.json({ limit: '10mb' }));

    const corsOptions: CorsOptions = {
        origin: DOMAIN_URL,
        credentials: true
    };

    app.use(cors(corsOptions));

    app.use('/uploads', express.static(staticPath));

    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir);
    }
};
