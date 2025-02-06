// server.ts
import {startHttpServer} from './server/startHttpServer.js';
import {startWebSocketServer} from './server/startWebSocketServer.js';
import {API_PORT, WS_PORT} from './config/serverConfig.js';

(async () => {
    try {
        const httpServer = await startHttpServer({port: API_PORT});
        await startWebSocketServer({app: httpServer, wsPort: WS_PORT});
    } catch (error) {
        if (error instanceof Error) {
            console.error(`Error starting servers: ${error.message}`);
        } else {
            console.error(`Unexpected error: ${error}`);
        }
        process.exit(1);
    }
})();
