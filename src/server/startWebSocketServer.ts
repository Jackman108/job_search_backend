import WebSocket, {WebSocketServer} from 'ws';
import http from 'http';
import {StartWebSocketServerParams} from '../interface/interface.js';
import {checkPort} from '../utils/checkPort.js';
import jwt from 'jsonwebtoken';

interface Client {
    ws: WebSocket;
    userId: string;
}

const clients = new Set<Client>();
let wss: WebSocketServer | null = null;

export const startWebSocketServer = async ({app, wsPort}: StartWebSocketServerParams): Promise<void> => {
    try {
        await checkPort(wsPort);
        const server = http.createServer(app);

        wss = new WebSocketServer({server});

        wss.on('connection', (ws: WebSocket, req) => {
            const urlParams = new URLSearchParams(req.url?.split('?')[1] || '');
            const token = urlParams.get('token');
            if (!token) {
                ws.close(1008, 'Authorization token is required');
                return;
            }

            const secret = process.env.JWT_SECRET;
            if (!secret) {
                throw new Error('JWT_SECRET not configured');
            }

            const decoded: any = jwt.verify(token, secret);
            const userId = decoded.id;

            if (!userId) {
                ws.close(1008, 'User ID is required',);
                return;
            }

            const client = {ws, userId};
            clients.add(client);
            ws.on('message', (message: WebSocket.MessageEvent) => {
            });
            ws.on('close', () => {
                clients.delete(client);
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
