import { ENV, Environment } from '@config';

// Базовые настройки браузера
export const BROWSER_CONFIG = {
    headless: ENV.isProduction,
    args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-infobars',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920x1080',
    ],
    defaultViewport: {
        width: 1920,
        height: 1080,
    },
    timeout: 30000,
};

// Настройки для разных окружений
export const ENV_BROWSER_CONFIG: Record<Environment, typeof BROWSER_CONFIG> = {
    production: {
        ...BROWSER_CONFIG,
        headless: true,
    },
    development: {
        ...BROWSER_CONFIG,
        headless: false,
    },
    test: {
        ...BROWSER_CONFIG,
        headless: true,
    },
}; 