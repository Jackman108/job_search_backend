import express from 'express';
import { initializeMiddleware } from '@middlewares';
import { initializeRoutes } from '@routes';
import { StartHttpServerParams } from '@interface';
import { checkPort } from '@utils';


export const startHttpServer = async ({
    port
}: StartHttpServerParams): Promise<express.Express> => {
    try {
        await checkPort(port);

        const app = express();
        initializeMiddleware(app);
        // Lightweight liveness probe (no auth, no DB) — safe for compose/k8s.
        app.get('/health', (_req, res) => {
            res.status(200).json({ status: 'ok', service: 'backend', ts: new Date().toISOString() });
        });
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
