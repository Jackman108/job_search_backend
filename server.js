// server.js
import { startHttpServer } from './server/startHttpServer.js';
import { startWebSocketServer } from './server/startWebSocketServer.js';

const apiPort = process.env.API_URL || 8000;
const wsPort = process.env.WS_PORT || 8080;

(async () => {
    try {
        const httpServer = await startHttpServer(apiPort);
        startWebSocketServer(httpServer, wsPort);
    } catch (error) {
        console.error(`Error starting servers: ${error.message}`);
    }
})();
