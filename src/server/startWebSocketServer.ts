import WebSocket, { WebSocketServer } from 'ws';
import http from 'http';
import jwt from 'jsonwebtoken';
import { StartWebSocketServerParams } from '@interface';
import { JWT_CONFIG } from '@config';
import { checkPort, logger } from '@utils';
import { handleWsHealthConnection, isWsHealthMessage, isWsHealthPath, sendWsHealth } from './wsHealth.js';

interface Client {
    ws: WebSocket;
    userId: string;
}

const clients = new Set<Client>();
let wss: WebSocketServer | null = null;

const attachAuthedClient = (ws: WebSocket, userId: string): void => {
    const client = { ws, userId };
    clients.add(client);
    ws.on('message', (message: WebSocket.RawData) => {
        if (isWsHealthMessage(message)) {
            sendWsHealth(ws);
            return;
        }
        logger.debug('WS message', { userId, bytes: message.toString().length });
    });
    ws.on('close', () => {
        clients.delete(client);
    });
    ws.send('connection WebSocket server!');
};

const authenticateConnection = (ws: WebSocket, reqUrl?: string): void => {
    const urlParams = new URLSearchParams(reqUrl?.split('?')[1] || '');
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
        const decoded = jwt.verify(token, secret) as { id?: string };
        const userId = decoded.id;
        if (!userId) {
            ws.close(1008, 'User ID is required');
            return;
        }
        attachAuthedClient(ws, userId);
    } catch (err) {
        if (err instanceof jwt.TokenExpiredError) {
            ws.close(1008, 'Token has expired. Please reauthenticate.');
        } else {
            ws.close(1008, 'Invalid token. Please reauthenticate.');
        }
    }
};

export const startWebSocketServer = async ({ app, wsPort }: StartWebSocketServerParams): Promise<void> => {
    try {
        await checkPort(wsPort);
        const server = http.createServer(app);
        wss = new WebSocketServer({ server });

        wss.on('connection', (ws: WebSocket, req) => {
            if (isWsHealthPath(req.url)) {
                handleWsHealthConnection(ws);
                return;
            }
            authenticateConnection(ws, req.url);
        });

        server.listen(wsPort, () => {
            logger.info(`WebSocket server is running on port ${wsPort}`);
        });
    } catch (err) {
        logger.error(`Error starting WebSocket server: ${(err as Error).message}`);
        throw err;
    }
};

export const broadcast = (data: string): void => {
    if (!wss) {
        return;
    }
    // Log only when vacancy table rows change — not every progress/heartbeat line.
    if (/Vacancy has been successfully (saved|deleted)/i.test(data)) {
        logger.info('WS table update', { data, clients: wss.clients.size });
    } else {
        logger.debug('WS broadcast', { data, clients: wss.clients.size });
    }
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(data);
        }
    });
};
