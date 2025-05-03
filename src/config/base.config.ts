import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Инициализация dotenv
dotenv.config();

// Базовые пути
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export type Environment = 'production' | 'development' | 'test';

export const BASE_PATHS = {
    uploads: path.join(__dirname, '../uploads'),
    static: path.join(__dirname, '../uploads'),
};

// Базовые настройки окружения
export const ENV = {
    NODE_ENV: (process.env.NODE_ENV || 'development') as Environment,
    isProduction: process.env.NODE_ENV === 'production',
    isDevelopment: process.env.NODE_ENV === 'development',
    isTest: process.env.NODE_ENV === 'test',
}; 