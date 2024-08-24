// server/middlewares.js
import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';
import fs from 'fs';
import { DOMAIN_URL, staticPath, uploadDir } from '../config/serverConfig.js';

export const initializeMiddleware = (app) => {
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    app.use(bodyParser.json({ limit: '10mb' }));

    app.use(cors({
        origin: DOMAIN_URL,
        credentials: true
    }));

    app.use('/uploads', express.static(staticPath));

    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir);
    }
};
