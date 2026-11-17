import { JWT_CONFIG, PORTS } from '@config';
import { startHttpServer, startWebSocketServer } from '@server';
import { resolveHhCredKey } from './platform/crypto/hhCredCrypto.js';
import { assertJwtSecret, logger } from '@utils';

process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception', {
        message: error.message,
        stack: error.stack,
    });
    process.exit(1);
});

process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled Rejection', {
        reason: reason instanceof Error ? reason.message : String(reason),
        stack: reason instanceof Error ? reason.stack : undefined,
    });
    process.exit(1);
});

(async () => {
    try {
        JWT_CONFIG.secret = assertJwtSecret(JWT_CONFIG.secret || process.env.JWT_SECRET);
        // S1: fail-fast in production if HH_CRED_KEY missing/weak; warn+dev key locally.
        resolveHhCredKey();
        if (process.env.NODE_ENV !== 'production') {
            logger.info('Dev mode: nodemon watches src + packages/hh-worker (restart on change)');
        }
        const httpServer = await startHttpServer({ port: PORTS.api });
        await startWebSocketServer({ app: httpServer, wsPort: PORTS.ws });
    } catch (error) {
        if (error instanceof Error) {
            logger.error(`Error starting servers: ${error.message}`, {
                stack: error.stack,
            });
        } else {
            logger.error(`Unexpected error: ${String(error)}`);
        }
        process.exit(1);
    }
})();
