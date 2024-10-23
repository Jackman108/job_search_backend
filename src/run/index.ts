//index.ts
import puppeteer, { Browser, Page } from 'puppeteer';
import { browserConfig } from '../config/brauserConfig.js';
import { authorize } from './authorize.js';
import { searchForVacancy } from './searchForVacancy.js';
import { navigateAndProcessVacancies } from './navigateAndProcessVacancies.js';
import { SELECTORS, TIMEOUTS } from '../constants.js';
import { reset, stop, isStopped } from '../utils/stopManager.js';
import * as dotenv from 'dotenv';
import { broadcast } from '../server/startWebSocketServer.js';
import { Counters, PuppeteerScriptParams } from '../interface/interface.js';
dotenv.config();

export async function runPuppeteerScript({
    userId,
    email,
    password,
    position,
    message,
    vacancyUrl
}: PuppeteerScriptParams): Promise<void> {
    let browser: Browser | null = null;
    let page: Page | null = null;

    const counters: Counters = {
        successfullySubmittedCount: 0,
        unsuccessfullySubmittedCount: 0
    };

    try {
        browser = await puppeteer.launch(browserConfig);
        page = await browser.newPage();

        reset();
        await page.setViewport({ width: 1440, height: 1000, deviceScaleFactor: 1, });
        await new Promise(resolve => setTimeout(resolve, TIMEOUTS.SHORT));

        await page.goto(vacancyUrl, { waitUntil: 'domcontentloaded', timeout: TIMEOUTS.LONG });
        console.log('Start script');
        const coockeHandle = await page.waitForSelector(
            SELECTORS.COOKIE_ACCEPT,
            { timeout: TIMEOUTS.SEARCH, visible: true }).catch(() => null);
        if (!coockeHandle || isStopped()) {
            broadcast('hh closed');
            await page.screenshot({ path: 'screenshot-closed.png' });
            stop(browser);
            return;
        } else {
            await page.click(SELECTORS.COOKIE_ACCEPT);
        }

        await authorize(page, email, password, browser);
        await page.screenshot({ path: 'screenshot-authorize.png' });
        if (isStopped()) {
            stop(browser);
            console.log('The script is stopped after authorization.');
            return;
        }

        await searchForVacancy({ page, position });
        await page.screenshot({ path: 'screenshot-search.png' });
        if (isStopped()) {
            stop(browser);
            console.log('The script is stopped after the job search.');
            return;
        }

        await navigateAndProcessVacancies({userId, page, counters, message, isStopped});
        await page.screenshot({ path: 'screenshot-navigate.png' });
        console.log(`Total number of forms successfully submitted: ${counters.successfullySubmittedCount}`);

    } catch (err) {
        console.error('Error during script execution:', err);
    } finally {
         if (browser) {
            await stop(browser);
        }
    }
}
