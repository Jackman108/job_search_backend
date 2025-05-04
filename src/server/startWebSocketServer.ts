import WebSocket, { WebSocketServer } from 'ws';
import http from 'http';
import { StartWebSocketServerParams } from '@interface';
import { checkPort } from '@utils';
import jwt from 'jsonwebtoken';
import { JWT_CONFIG } from '@config';

interface Client {
    ws: WebSocket;
    userId: string;
}

const clients = new Set<Client>();
let wss: WebSocketServer | null = null;

export const startWebSocketServer = async ({ app, wsPort }: StartWebSocketServerParams): Promise<void> => {
    try {
        await checkPort(wsPort);
        const server = http.createServer(app);

        wss = new WebSocketServer({ server });

        wss.on('connection', (ws: WebSocket, req) => {
            const urlParams = new URLSearchParams(req.url?.split('?')[1] || '');
            const token = urlParams.get('token');
            if (!token) {
                ws.close(1008, 'Authorization token is required');
                return;
            }

            const secret = JWT_CONFIG.secret;
            if (!secret) {
                throw new Error('JWT_SECRET not configured');
            }
            try {
                const decoded: any = jwt.verify(token, secret);
                const userId = decoded.id;

                if (!userId) {
                    ws.close(1008, 'User ID is required',);
                    return;
                }

                const client = { ws, userId };
                clients.add(client);
                ws.on('message', (message: WebSocket.MessageEvent) => {
                    console.log('message', message);
                });
                ws.on('close', () => {
                    clients.delete(client);
                });
                ws.send('connection WebSocket server!');
            } catch (err) {
                if (err instanceof jwt.TokenExpiredError) {
                    ws.close(1008, 'Token has expired. Please reauthenticate.');
                } else {
                    ws.close(1008, 'Invalid token. Please reauthenticate.');
                }
            }
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
