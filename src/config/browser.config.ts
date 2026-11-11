import type { Environment } from './base.config.js';

/**
 * HH / Puppeteer stays headless by default (dev + prod).
 * Headed only for explicit debug:
 *   HH_HEADED=1
 *   PUPPETEER_HEADLESS=false
 */
export function resolvePuppeteerHeadless(): boolean {
    const headed = process.env.HH_HEADED;
    if (headed === '1' || headed?.toLowerCase() === 'true') {
        return false;
    }

    const puppeteerHeadless = process.env.PUPPETEER_HEADLESS;
    if (puppeteerHeadless === '0' || puppeteerHeadless?.toLowerCase() === 'false') {
        return false;
    }

    return true;
}

const headless = resolvePuppeteerHeadless();

// Базовые настройки браузера
export const BROWSER_CONFIG = {
    headless,
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

// Настройки для разных окружений (all headless unless debug env set)
export const ENV_BROWSER_CONFIG: Record<Environment, typeof BROWSER_CONFIG> = {
    production: {
        ...BROWSER_CONFIG,
        headless,
    },
    development: {
        ...BROWSER_CONFIG,
        headless,
    },
    test: {
        ...BROWSER_CONFIG,
        headless,
    },
};
