import express from 'express';
import { checkPort } from '../utils/checkPort.js';
import { initializeMiddleware } from './middlewares.js';
import { initializeRoutes } from './routes.js';

export const startHttpServer = async (port) => {
    try {
        await checkPort(port);

        const app = express();
        initializeMiddleware(app);
        initializeRoutes(app);

        const server = app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });

        return server;
    } catch (err) {
        console.error(`Error starting HTTP server: ${err.message}`);
        throw err;
    }
};
