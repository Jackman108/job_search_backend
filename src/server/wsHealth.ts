import WebSocket from 'ws';
import { buildHealthPayload, HEALTH_WS_PATH } from '@utils';

export const isWsHealthPath = (url?: string): boolean => {
    if (!url) {
        return false;
    }
    const path = url.split('?')[0] || '/';
    return path === HEALTH_WS_PATH;
};

export const sendWsHealth = (ws: WebSocket, service = 'backend-ws'): void => {
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(buildHealthPayload(service)));
    }
};

/** Unauthenticated liveness probe: connect to `/health`, get JSON, close. */
export const handleWsHealthConnection = (ws: WebSocket): void => {
    sendWsHealth(ws);
    ws.close(1000, 'health ok');
};

export const isWsHealthMessage = (raw: WebSocket.RawData): boolean => {
    const text = typeof raw === 'string' ? raw : raw.toString();
    const trimmed = text.trim();
    if (trimmed === 'health' || trimmed === 'ping') {
        return true;
    }
    try {
        const parsed = JSON.parse(trimmed) as { type?: string };
        return parsed?.type === 'health' || parsed?.type === 'ping';
    } catch {
        return false;
    }
};
