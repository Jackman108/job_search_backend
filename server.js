// server.js
import { startHttpServer } from './server/startHttpServer.js';
import { startWebSocketServer } from './server/startWebSocketServer.js';
import { API_URL, WS_URL } from "./config/serverConfig.js";

(async () => {
    try {
        const httpServer = await startHttpServer(API_URL);
        startWebSocketServer(httpServer, WS_URL);
    } catch (error) {
        console.error(`Error starting servers: ${error.message}`);
    }
})();
