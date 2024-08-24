// server.js
import { startHttpServer } from './server/startHttpServer.js';
import { startWebSocketServer } from './server/startWebSocketServer.js';
import { API_PORT, WS_PORT } from "./config/serverConfig.js";

(async () => {
    try {
        const httpServer = await startHttpServer(API_PORT);
        startWebSocketServer(httpServer, WS_PORT);
    } catch (error) {
        console.error(`Error starting servers: ${error.message}`);
    }
})();
