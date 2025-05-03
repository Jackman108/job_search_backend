import { ENV } from './base.config.js';

// Настройки хоста и протоколов
export const HOST = process.env.HOST || 'localhost';
export const PROTOCOL = process.env.PROTOCOL || 'http';
export const PROTOCOL_WS = process.env.PROTOCOL_WS || 'ws';

// Портовая конфигурация
export const PORTS = {
    domain: parseInt(process.env.DOMAIN_PORT || '3000', 10),
    api: parseInt(process.env.API_PORT || '8000', 10),
    ws: parseInt(process.env.WS_PORT || '8080', 10),
};

// URL конфигурация
export const URLS = {
    domain: process.env.DOMAIN_URL || `${PROTOCOL}://${HOST}:${PORTS.domain}`,
    api: process.env.API_URL || `${PROTOCOL}://${HOST}:${PORTS.api}`,
    ws: process.env.WS_URL || `${PROTOCOL_WS}://${HOST}:${PORTS.ws}`,
};

// Настройки CORS
export const CORS_CONFIG = {
    origin: URLS.domain,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};

// Настройки JWT
export const JWT_CONFIG = {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
};

// Настройки загрузки файлов
export const UPLOAD_CONFIG = {
    maxFileSize: '10mb',
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif'],
}; 