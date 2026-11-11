import { Page } from 'puppeteer';
import { stage } from './stageLog.js';

/** Wipe cookies + HTTP cache so a new job does not reuse CAPTCHA / auth state. */
export async function clearBrowserSession(page: Page): Promise<void> {
    const client = await page.createCDPSession();
    await client.send('Network.clearBrowserCookies').catch(() => undefined);
    await client.send('Network.clearBrowserCache').catch(() => undefined);
    await page.deleteCookie(...(await page.cookies())).catch(() => undefined);
    stage('session', 'cookies+cache cleared');
}
