import express from 'express';
import { initializeMiddleware } from './middlewares.js';
import { initializeRoutes } from './routes.js';
import { StartHttpServerParams } from '../interface/interface.js';
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
