// server.ts

import { PORTS } from '@config';
import { startHttpServer, startWebSocketServer } from '@server';


process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    if (error.stack) {
        console.error('Stack trace:', error.stack);
    }
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});


(async () => {
    try {
        const httpServer = await startHttpServer({ port: PORTS.api });
        await startWebSocketServer({ app: httpServer, wsPort: PORTS.ws });
    } catch (error) {
        if (error instanceof Error) {
            console.error(`Error starting servers: ${error.message}`);
            if (error.stack) {
                console.error('Stack trace:', error.stack);
            }
        } else {
            console.error(`Unexpected error: ${error}`);
        }
        process.exit(1);
    }
})();
