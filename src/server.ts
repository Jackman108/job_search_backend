// server.ts
import { startHttpServer } from './server/startHttpServer.js';
import { startWebSocketServer } from './server/startWebSocketServer.js';
import { API_PORT, WS_PORT } from './config/serverConfig.js';


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
        const httpServer = await startHttpServer({ port: API_PORT });
        await startWebSocketServer({ app: httpServer, wsPort: WS_PORT });
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
