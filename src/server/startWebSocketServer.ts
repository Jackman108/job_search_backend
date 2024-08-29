import WebSocket, { WebSocketServer } from 'ws';
import http from 'http';
import { StartWebSocketServerParams } from '../interface/interface.js';
import { checkPort } from '../utils/checkPort.js';


const clients = new Set<WebSocket>();
let wss: WebSocketServer | null = null;

export const startWebSocketServer = async ({ app, wsPort }: StartWebSocketServerParams): Promise<void> => {
    try {
        await checkPort(wsPort);
        const server = http.createServer(app);

        wss = new WebSocketServer({ server });
        wss.on('connection', (ws: WebSocket) => {
            clients.add(ws);
            ws.on('message', (message: WebSocket.MessageEvent) => {
            });
            ws.on('close', () => {
                clients.delete(ws);
            });
            ws.send('connection WebSocket server!');
        });
        server.listen(wsPort, () => {
            console.log(`WebSocket server is running on port ${wsPort}`);
        });
    } catch (err) {
        console.error(`Error starting WebSocket server: ${(err as Error).message}`);
        throw err;
    }
}

export const broadcast = (data: string) => {
    if (wss) {
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(data);
            }
        });
    }
};
