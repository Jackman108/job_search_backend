import type { Environment } from './base.config.js';
import type { PuppeteerLaunchOptions } from 'puppeteer';

/**
 * HH / Puppeteer stays headless by default (dev + prod).
 * Headed only for explicit debug (closest to a real browser — fewer CAPTCHAs):
 *   HH_HEADED=1
 *   PUPPETEER_HEADLESS=false
 * Optional warm profile (reuse cookies across jobs):
 *   HH_USER_DATA_DIR=C:\path\to\hh-profile
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
const userDataDir = process.env.HH_USER_DATA_DIR?.trim() || undefined;

export const BROWSER_CONFIG: PuppeteerLaunchOptions = {
    headless,
    userDataDir,
    // Hide --enable-automation; block AutomationControlled blink feature.
    ignoreDefaultArgs: ['--enable-automation'],
    args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-infobars',
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled',
        '--window-size=1440,1000',
        '--lang=ru-RU,ru',
    ],
    defaultViewport: {
        width: 1440,
        height: 1000,
    },
    timeout: 30000,
};

export const ENV_BROWSER_CONFIG: Record<Environment, PuppeteerLaunchOptions> = {
    production: { ...BROWSER_CONFIG, headless },
    development: { ...BROWSER_CONFIG, headless },
    test: { ...BROWSER_CONFIG, headless },
};
