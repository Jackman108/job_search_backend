// src/modules/initializeBrowser.ts

import { Browser, Page } from 'puppeteer';
import { SELECTORS, TIMEOUTS } from '../constants.js';
import { broadcast } from '../server/startWebSocketServer.js';
import { reset, stop } from '../utils/stopManager.js';

export async function initializeBrowser(vacancyUrl: string, browser: Browser, page: Page) {
    try {
        reset();
        await page.setViewport({ width: 1440, height: 1000, deviceScaleFactor: 1 });
        await new Promise(resolve => setTimeout(resolve, TIMEOUTS.SHORT));

        await page.goto(vacancyUrl, { waitUntil: 'domcontentloaded', timeout: TIMEOUTS.LONG });
        console.log('Start script');

        const cookieHandle = await page.waitForSelector(SELECTORS.COOKIE_ACCEPT,
            { timeout: TIMEOUTS.SEARCH, visible: true }
        ).catch(() => null);

        if (!cookieHandle) {
            broadcast('hh closed');
            await page.screenshot({ path: 'screenshot-closed.png' });
            await stop(browser);
            return false;
        } else {
            await page.click(SELECTORS.COOKIE_ACCEPT);
        }

        return { browser, page };
    } catch (error) {
        await stop(browser);
        console.error('Error initializing browser page:', error);
        return false;
    }
}
