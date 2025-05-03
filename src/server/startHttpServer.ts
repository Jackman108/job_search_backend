import express from 'express';
import { initializeMiddleware } from '../middlewares/index.js';
import { initializeRoutes } from './routes.js';
import { StartHttpServerParams } from '../interface/index.js';
import { checkPort } from '../utils/checkPort.js';


export const startHttpServer = async ({
    port
}: StartHttpServerParams): Promise<express.Express> => {
    try {
        await checkPort(port);

        const app = express();
        initializeMiddleware(app);
        initializeRoutes(app);

        app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });

        return app;
    } catch (err) {
        console.error(`Error starting HTTP server: ${(err as Error).message}`);
        throw err;
    }
};
