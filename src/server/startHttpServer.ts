import express from 'express';
import { initializeMiddleware, errorMiddleware } from '@middlewares';
import { initializeRoutes } from '@routes';
import { StartHttpServerParams } from '../interface/index.js';
import { checkPort, logger } from '../utils/index.js';

export const startHttpServer = async ({ port }: StartHttpServerParams): Promise<express.Express> => {
    try {
        await checkPort(port);

        const app = express();
        initializeMiddleware(app);
        initializeRoutes(app);
        app.use(errorMiddleware);

        app.listen(port, () => {
            logger.info(`Server is running on port ${port}`);
        });

        return app;
    } catch (err) {
        logger.error(`Error starting HTTP server: ${(err as Error).message}`);
        throw err;
    }
};
