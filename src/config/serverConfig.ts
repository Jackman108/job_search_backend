import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const uploadDir = path.join(__dirname, '../uploads');
export const staticPath = path.join(__dirname, '../uploads');

export const HOST = process.env.HOST || 'localhost';
export const PROTOCOL = process.env.PROTOCOL || 'http';
export const PROTOCOL_WS = process.env.PROTOCOL_WS || 'ws';
export const DOMAIN_PORT = parseInt(process.env.DOMAIN_PORT || '3000', 10);
export const API_PORT = parseInt(process.env.API_PORT || '8000', 10);
export const WS_PORT = parseInt(process.env.WS_PORT || '8080', 10);
export const DOMAIN_URL = process.env.DOMAIN_URL || `${PROTOCOL}://${HOST}:${DOMAIN_PORT}`;
export const API_URL = process.env.API_URL || `${PROTOCOL}://${HOST}:${API_PORT}`;
export const WS_URL = process.env.WS_URL || `${PROTOCOL_WS}://${HOST}:${WS_PORT}`;
