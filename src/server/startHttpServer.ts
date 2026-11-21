import express from 'express';
import { initializeMiddleware, errorMiddleware } from '@middlewares';
import { initializeRoutes } from '@routes';
import { StartHttpServerParams } from '../interface/index.js';
import { buildHealthPayload, checkPort, logger } from '../utils/index.js';

export const startHttpServer = async ({ port }: StartHttpServerParams): Promise<express.Express> => {
    try {
        await checkPort(port);

        const app = express();
        initializeMiddleware(app);
        // Lightweight liveness probe (no auth, no DB) — safe for compose/k8s.
        app.get('/health', (_req, res) => {
            res.status(200).json(buildHealthPayload('backend'));
        });
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
