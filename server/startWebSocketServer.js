import WebSocket, { WebSocketServer } from 'ws';
import { checkPort } from '../utils/checkPort.js';

const clients = new Set();
let wss

export const startWebSocketServer = async (httpServer, wsPort) => {
    try {
        await checkPort(wsPort);
        wss = new WebSocketServer({ server: httpServer });

        wss.on('connection', (ws) => {
            console.log('New WebSocket connection');
            clients.add(ws);

            ws.on('message', (message) => {
                console.log(`Received message: ${message}`);
            });

            ws.on('close', () => {
                console.log('WebSocket connection closed');
                clients.delete(ws);
            });

            ws.send('Welcome to the WebSocket server!');
        });   
        console.log(`WebSocket server is running on port ${wsPort}`);
    } catch (err) {
        console.error(`Error starting WebSocket server: ${err.message}`);
        throw err;
    }
}

export const broadcast = (data) => {
    if (wss) {
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(data);
            }
        });
    }
};
